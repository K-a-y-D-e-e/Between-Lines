import { WritingView } from "@/components/WritingView";

export default async function PoemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <WritingView id={id} section="poems" />;
}
