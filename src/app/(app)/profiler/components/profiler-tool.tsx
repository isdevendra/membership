"use client";

import { useFormState, useFormStatus } from "react-dom";
import { BrainCircuit, Sparkles } from "lucide-react";
import { generateSummary, type FormState } from "@/app/(app)/profiler/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
          Analyzing...
        </>
      ) : (
        <>
          <BrainCircuit className="mr-2 h-4 w-4" />
          Generate Summary
        </>
      )}
    </Button>
  );
}

export function ProfilerTool() {
  const initialState: FormState = {
    message: "",
  };
  const [state, formAction] = useFormState(generateSummary, initialState);

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Patron Profiling Tool</CardTitle>
          <CardDescription>
            Enter a patron's transaction data to generate an AI-powered summary of their visit.
          </CardDescription>
        </CardHeader>
        <form action={formAction}>
          <CardContent className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="transactionData">Transaction Data</Label>
              <Textarea
                id="transactionData"
                name="transactionData"
                placeholder="Paste transaction data here, e.g., 'Played Blackjack for 2 hours, spent $500. Played Slots for 30 minutes, won $120...'"
                className="min-h-[200px]"
                defaultValue={state.fields?.transactionData}
              />
            </div>
            {state.issues && (
                <div className="text-sm font-medium text-destructive">
                    {state.issues.join(", ")}
                </div>
            )}
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Visit Summary</CardTitle>
          <CardDescription>
            The generated summary will appear below.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {useFormStatus().pending ? (
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
            ) : state.summary ? (
                <p className="text-sm leading-relaxed">{state.summary}</p>
            ) : (
                <p className="text-sm text-muted-foreground">
                    The summary will be displayed here once generated.
                </p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
