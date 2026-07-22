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
}

export function ResultView({
  originalText,
  translation,
  loading,
  error,
  onStartOver,
}: ResultViewProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <h2 className="text-center text-xl font-bold text-blue">Original text 👇</h2>
      <p className="m-0 min-h-[100px] w-full whitespace-pre-wrap rounded-lg bg-field-bg px-3.5 py-3 text-lg font-semibold text-[#333]">
        {originalText}
      </p>

      <h2 className="text-center text-xl font-bold text-blue">Your translation 👇</h2>

      {loading && <TranslationSkeleton />}

      {!loading && error && (
        <Alert variant="destructive" className="border-destructive/30 bg-destructive/5">
          <AlertCircle />
          <AlertDescription className="text-base font-semibold text-destructive">
            {error}
          </AlertDescription>
        </Alert>
      )}

      {!loading && !error && (
        <p className="m-0 min-h-[100px] w-full animate-fade-in whitespace-pre-wrap rounded-lg bg-field-bg px-3.5 py-3 text-lg font-semibold text-black">
          {translation}
        </p>
      )}

      <Button
        onClick={onStartOver}
        className="mt-1 h-[50px] w-full rounded-md bg-blue text-2xl font-bold text-white hover:bg-blue/90"
      >
        Start Over
      </Button>
    </div>
  );
}

function TranslationSkeleton() {
  return (
    <div
      className="flex min-h-[100px] flex-col justify-center gap-2.5 rounded-lg bg-field-bg px-3.5 py-3"
      role="status"
      aria-label="Translating"
    >
      <Skeleton className="shimmer-line h-3.5 w-[90%] !animate-shimmer" />
      <Skeleton className="shimmer-line h-3.5 w-[75%] !animate-shimmer" />
      <Skeleton className="shimmer-line h-3.5 w-[55%] !animate-shimmer" />
    </div>
  );
}
