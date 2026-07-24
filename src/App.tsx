import { Header } from "@/components/Header";
import { ChatView } from "@/components/chat/ChatView";

export default function App() {
  return (
    <div className="bg-page-bg flex min-h-dvh items-center justify-center p-4">
      <main className="border-card-border flex h-[85dvh] max-h-[760px] w-full max-w-[400px] flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
        <Header />
        <ChatView />
      </main>
    </div>
  );
}
