import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Layers, Sparkles } from "lucide-react";

export default function LandingPage() {
  const navigate = useNavigate();

  const openDashboard = () => navigate("/dashboard");
  const generateFromPrompt = () => navigate("/dashboard", { state: { openAIDialog: true } });

  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white">
      <div className="container mx-auto px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg mb-6">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-primary-200 to-primary-400 bg-clip-text text-transparent">
            Your opensource alternative to figma
          </h1>
          <p className="mt-5 text-lg text-neutral-300 max-w-2xl mx-auto">
            Design, collaborate, and generate layouts with AI. No signup required.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={openDashboard} size="lg" className="gradient-primary text-white px-6 py-6">
              Open Dashboard
            </Button>
            <Button onClick={generateFromPrompt} size="lg" variant="outline" className="border-neutral-700 text-white hover:bg-neutral-800">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate from Prompt
            </Button>
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="text-neutral-400 text-sm">Open Source</div>
            <div className="mt-2 text-neutral-200">Self-hostable design tool with AI</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="text-neutral-400 text-sm">Fast & Familiar</div>
            <div className="mt-2 text-neutral-200">Keyboard-driven editor, layers, components</div>
          </div>
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6">
            <div className="text-neutral-400 text-sm">AI Powered</div>
            <div className="mt-2 text-neutral-200">Generate and refine designs from a prompt</div>
          </div>
        </div>
      </div>
    </div>
  );
}
