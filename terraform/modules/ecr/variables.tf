variable "project" {
  description = "Project name prefix (used as ECR namespace)"
  type        = string
}

variable "max_image_count" {
  description = "Maximum number of images to keep per repository (lifecycle policy)"
  type        = number
  default     = 10
}

variable "tags" {
  description = "Common tags"
  type        = map(string)
  default     = {}
}
