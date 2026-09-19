export type Kind = "poem" | "fragment" | "letter";
export type Status = "draft" | "published";

export interface Profile {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Writing {
  id: string;
  author_id: string;
  kind: Kind;
  title: string;
  content: string;
  recipient: string | null;
  cover_url: string | null;
  status: Status;
  created_at: string;
  updated_at: string;
  published_at: string | null;
  author: Pick<Profile, "id" | "display_name" | "username" | "avatar_url"> | null;
  tags: Tag[];
}
