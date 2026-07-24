import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ResultViewProps {
  originalText: string;
  translation: string;
  loading: boolean;
  error: string;
  onStartOver: () => void;
  onTryAgain: () => void;
}

export function ResultView({
  originalText,
  translation,
  loading,
  error,
  onStartOver,
  onTryAgain,
}: ResultViewProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-blue text-center text-xl font-bold">Original text 👇</h2>
      <p className="bg-field-bg m-0 min-h-[100px] w-full rounded-lg px-3.5 py-3 text-lg font-semibold whitespace-pre-wrap text-[#333]">
        {originalText}
      </p>

      <h2 className="text-blue text-center text-xl font-bold">Your translation 👇</h2>

      {loading && <TranslationSkeleton />}

      {!loading && error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertCircle />
          <AlertDescription className="text-destructive text-base font-semibold">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <p className="animate-fade-in bg-field-bg m-0 min-h-[100px] w-full rounded-lg px-3.5 py-3 text-lg font-semibold whitespace-pre-wrap text-black">
          {translation}
        </p>
      )}

      {error ? (
        <Button
          onClick={onTryAgain}
          className="bg-blue hover:bg-blue/90 mt-1 h-[50px] w-full rounded-md text-2xl font-bold text-white"
        >
          Try Again
        </Button>
      ) : (
        <Button
          onClick={onStartOver}
          disabled={loading}
          className="bg-blue hover:bg-blue/90 mt-1 h-[50px] w-full rounded-md text-2xl font-bold text-white"
        >
          Start Over
        </Button>
      )}
    </div>
  );
}

function TranslationSkeleton() {
  return (
    <div
      className="bg-field-bg flex min-h-[100px] flex-col justify-center gap-2.5 rounded-lg px-3.5 py-3"
      role="status"
      aria-label="Translating"
    >
      <Skeleton className="shimmer-line !animate-shimmer h-3.5 w-[90%]" />
      <Skeleton className="shimmer-line !animate-shimmer h-3.5 w-[75%]" />
      <Skeleton className="shimmer-line !animate-shimmer h-3.5 w-[55%]" />
    </div>
  );
}
