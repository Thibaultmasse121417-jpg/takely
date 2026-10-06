import { getServerDict } from "@/lib/locale";
import { AdView } from "./AdView";

export default async function AdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t } = await getServerDict();
  return <AdView id={id} t={t.ad} />;
}
