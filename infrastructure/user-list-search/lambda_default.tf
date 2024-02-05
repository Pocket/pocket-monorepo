data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "index.js"
  output_path = "index.js.zip"
}
