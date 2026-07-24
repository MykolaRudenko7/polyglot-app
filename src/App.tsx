import { Header } from "@/components/Header";
import { ChatView } from "@/components/chat/ChatView";

export default function App() {
  return (
    <div className="bg-page-bg flex min-h-dvh justify-center sm:items-center sm:p-6">
      <main className="sm:border-card-border flex h-dvh w-full flex-col overflow-hidden bg-white sm:h-[85dvh] sm:max-h-[760px] sm:max-w-[400px] sm:rounded-2xl sm:border sm:shadow-sm">
        <Header />
        <ChatView />
      </main>
    </div>
  );
}
