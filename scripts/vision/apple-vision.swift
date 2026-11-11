// Apple Vision 批量体检：对一个目录里的图片跑分类、美学、OCR、人脸、人体、动物、显著区域、条码、相似度
// 用法：swift scripts/vision/apple-vision.swift <图片目录> <输出 json>
import Foundation
import ImageIO
import Vision

let args = CommandLine.arguments
guard args.count >= 3 else {
  print("用法：swift apple-vision.swift <图片目录> <输出 json>")
  exit(1)
}
let inputDir = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])

let exts: Set<String> = ["jpg", "jpeg", "png", "heic"]
// 递归取图，结果里用相对路径做 id
let files = (FileManager.default.enumerator(at: inputDir, includingPropertiesForKeys: nil)?.allObjects as? [URL] ?? [])
  .filter { exts.contains($0.pathExtension.lowercased()) }
  .sorted { $0.path < $1.path }
let rootPath = inputDir.standardizedFileURL.path + "/"
func relative(_ url: URL) -> String { url.standardizedFileURL.path.replacingOccurrences(of: rootPath, with: "") }

// 计时
func timed<T>(_ ms: inout [String: Double], _ key: String, _ body: () async throws -> T) async rethrows -> T {
  let start = Date()
  let value = try await body()
  ms[key] = (Date().timeIntervalSince(start) * 1000).rounded()
  return value
}

// 三位小数，JSON 里不出现长尾浮点
func round3<T: BinaryFloatingPoint>(_ value: T) -> NSDecimalNumber { NSDecimalNumber(string: String(format: "%.3f", Double(value))) }

func rect(_ box: NormalizedRect) -> [NSDecimalNumber] {
  let r = box.cgRect
  return [r.origin.x, r.origin.y, r.width, r.height].map { round3(Double($0)) }
}

var results: [[String: Any]] = []
var prints: [(String, FeaturePrintObservation)] = []

// 单张图跑全部请求
func analyze(_ file: URL) async throws -> ([String: Any], FeaturePrintObservation) {
  var ms: [String: Double] = [:]
  var item: [String: Any] = ["file": relative(file)]
  if let source = CGImageSourceCreateWithURL(file as CFURL, nil),
    let props = CGImageSourceCopyPropertiesAtIndex(source, 0, nil) as? [CFString: Any]
  {
    item["width"] = props[kCGImagePropertyPixelWidth]
    item["height"] = props[kCGImagePropertyPixelHeight]
  }

  // 场景分类：只留置信度 ≥ 0.1 的前 10 个
  let labels = try await timed(&ms, "classify") { try await ClassifyImageRequest().perform(on: file) }
  item["labels"] = labels.filter { $0.confidence >= 0.1 }.prefix(10).map { ["id": $0.identifier, "p": round3($0.confidence)] }

  // 美学评分和“实用图”（截图、票据、文档）判断
  let aesthetics = try await timed(&ms, "aesthetics") { try await CalculateImageAestheticsScoresRequest().perform(on: file) }
  item["aesthetics"] = ["score": round3(aesthetics.overallScore), "utility": aesthetics.isUtility]

  // OCR：简体中文 + 英文
  var textRequest = RecognizeTextRequest()
  textRequest.recognitionLanguages = [Locale.Language(identifier: "zh-Hans"), Locale.Language(identifier: "en-US")]
  let request = textRequest
  let lines = try await timed(&ms, "ocr") { try await request.perform(on: file) }
  let texts = lines.compactMap { $0.topCandidates(1).first?.string }
  item["text"] = ["lines": texts, "chars": texts.joined().count]

  let faces = try await timed(&ms, "faces") { try await DetectFaceRectanglesRequest().perform(on: file) }
  item["faces"] = faces.count

  var humanRequest = DetectHumanRectanglesRequest()
  humanRequest.upperBodyOnly = false
  let humanReq = humanRequest
  let humans = try await timed(&ms, "humans") { try await humanReq.perform(on: file) }
  item["humans"] = humans.count

  let animals = try await timed(&ms, "animals") { try await RecognizeAnimalsRequest().perform(on: file) }
  item["animals"] = animals.compactMap { $0.labels.first?.identifier }

  // 显著区域：自动裁剪配图用
  let saliency = try await timed(&ms, "saliency") { try await GenerateAttentionBasedSaliencyImageRequest().perform(on: file) }
  item["salient"] = saliency.salientObjects.map { rect($0.boundingBox) }

  let barcodes = try await timed(&ms, "barcodes") { try await DetectBarcodesRequest().perform(on: file) }
  // 只记个数，票据二维码内容不落盘
  item["barcodes"] = barcodes.count

  // 特征向量：后面算两两距离，用来去重
  let print = try await timed(&ms, "featureprint") { try await GenerateImageFeaturePrintRequest().perform(on: file) }
  item["ms"] = ms
  return (item, print)
}

// 先空跑一张，模型加载时间不算进单张耗时
if let first = files.first { _ = try await analyze(first) }

for file in files {
  let (item, print) = try await analyze(file)
  results.append(item)
  prints.append((relative(file), print))
  let total = (item["ms"] as? [String: Double])?.values.reduce(0, +) ?? 0
  FileHandle.standardError.write("\(relative(file)) \(total)ms\n".data(using: .utf8)!)
}

// 每张图最相近的另一张
var nearest: [String: Any] = [:]
for (name, print) in prints {
  var best: (String, Double)? = nil
  for (other, otherPrint) in prints where other != name {
    let distance = try print.distance(to: otherPrint)
    if best == nil || distance < best!.1 { best = (other, distance) }
  }
  if let best { nearest[name] = ["file": best.0, "distance": round3(best.1)] }
}

let output: [String: Any] = ["images": results, "nearest": nearest]
let data = try JSONSerialization.data(withJSONObject: output, options: [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes])
try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
try data.write(to: outputURL)
print("写入 \(outputURL.path)，共 \(results.count) 张")
