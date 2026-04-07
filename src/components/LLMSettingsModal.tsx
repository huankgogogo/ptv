"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLLMConfig } from "@/hooks/useLLMConfig";
import { AlertCircle, Eye, EyeOff, Settings } from "lucide-react";
import { useState } from "react";

export function LLMSettingsModal() {
  const { config, setConfig, isConfigured } = useLLMConfig();
  const [open, setOpen] = useState(false);
  const [localBaseURL, setLocalBaseURL] = useState("");
  const [localApiKey, setLocalApiKey] = useState("");
  const [localModel, setLocalModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalBaseURL(config.baseURL);
      setLocalApiKey(config.apiKey);
      setLocalModel(config.model);
    }
    setOpen(isOpen);
  };

  const handleSave = () => {
    setConfig({
      baseURL: localBaseURL.trim(),
      apiKey: localApiKey.trim(),
      model: localModel.trim(),
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          {!isConfigured && (
            <AlertCircle className="w-4 h-4 text-orange-400" />
          )}
          <Settings className="w-4 h-4" />
          API Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px] bg-background-elevated border-border text-foreground">
        <DialogHeader>
          <DialogTitle>API Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Base URL</label>
            <input
              type="text"
              value={localBaseURL}
              onChange={(e) => setLocalBaseURL(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground text-sm font-sans focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">API Key</label>
            <div className="relative">
              <input
                type={showApiKey ? "text" : "password"}
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2 pr-10 rounded border border-border bg-input text-foreground text-sm font-sans focus:outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="grid gap-2">
            <label className="text-sm text-muted-foreground">Model</label>
            <input
              type="text"
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              placeholder="gpt-4o"
              className="w-full px-3 py-2 rounded border border-border bg-input text-foreground text-sm font-sans focus:outline-none focus:border-primary"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
