export interface CourseDocument {
  course_name: string
  readable_filename: string
  url: string
  s3_path: string
  created_at: string
  base_url: string
  doc_groups: string[]
}

export interface DocumentGroup {
  name: string
  enabled: boolean
  course_name: string
  doc_count: number
}
