export interface Event {
  id: string
  name: string
  slug: string
  date: string
  cover_image_url: string | null
  description: string | null
  created_at: string
}

export interface Photo {
  id: string
  event_id: string
  storage_path: string
  thumbnail_path: string | null
  uploader_name: string | null
  instagram_handle: string | null
  is_featured: boolean
  is_hidden: boolean
  width: number | null
  height: number | null
  file_size: number | null
  created_at: string
}

export interface Database {
  public: {
    Tables: {
      events: {
        Row: Event
        Insert: Omit<Event, 'id' | 'created_at'>
        Update: Partial<Omit<Event, 'id' | 'created_at'>>
      }
      photos: {
        Row: Photo
        Insert: Omit<Photo, 'id' | 'created_at'>
        Update: Partial<Omit<Photo, 'id' | 'created_at'>>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
