"use client";
import React, { useState } from 'react';
import { useAuth, type ApiKey } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CopyIcon, CheckIcon, PlusIcon, TrashIcon } from 'lucide-react';

export function ApiKeyManager() {
  const { user, apiKeys, selectedApiKey, selectApiKey, refreshApiKeys } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyRateLimit, setNewKeyRateLimit] = useState(100);
  const [error, setError] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground text-center">
            Please sign in to manage API keys
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const response = await fetch('/api/user/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newKeyName,
          rateLimit: newKeyRateLimit,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Show the actual key to user (only time they'll see it)
        if (data.key) {
          setCopiedKey(data.key);
          // Auto-copy to clipboard
          navigator.clipboard.writeText(data.key).catch(console.error);
        }
        
        // Reset form
        setNewKeyName('');
        setNewKeyRateLimit(100);
        setShowCreateForm(false);
        
        // Refresh the list
        await refreshApiKeys();
      } else {
        setError(data.error || 'Failed to create API key');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/user/api-keys/${keyId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // If this was the selected key, clear selection
        if (selectedApiKey === keyId) {
          selectApiKey(null);
        }
        await refreshApiKeys();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete API key');
      }
    } catch (err) {
      setError('Network error');
    }
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>API Keys</CardTitle>
            <Button
              onClick={() => setShowCreateForm(true)}
              size="sm"
              disabled={apiKeys.length >= 5} // Max 5 keys per user
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Create Key
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {apiKeys.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No API keys created yet. Create your first key to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className={`p-3 border rounded-lg ${
                    selectedApiKey === key.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{key.name}</h4>
                        {selectedApiKey === key.id && (
                          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {key.keyPreview}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(key.keyPreview, key.id)}
                        >
                          {copiedKey === key.id ? (
                            <CheckIcon className="h-3 w-3" />
                          ) : (
                            <CopyIcon className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Rate limit: {key.rateLimit}/min • 
                        Requests: {key.totalRequests} • 
                        Created: {new Date(key.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {selectedApiKey !== key.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectApiKey(key.id)}
                        >
                          Select
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteKey(key.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {apiKeys.length >= 5 && (
            <p className="text-sm text-muted-foreground mt-4">
              Maximum of 5 API keys allowed per user.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Create Key Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div>
                <Label htmlFor="keyName">Key Name</Label>
                <Input
                  id="keyName"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="My App Key"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rateLimit">Rate Limit (requests per minute)</Label>
                <Input
                  id="rateLimit"
                  type="number"
                  value={newKeyRateLimit}
                  onChange={(e) => setNewKeyRateLimit(parseInt(e.target.value) || 100)}
                  min={1}
                  max={1000}
                  required
                />
              </div>

              {error && (
                <div className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded">
                  {error}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Key'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* New Key Display */}
      {copiedKey && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-900/20">
          <CardContent className="pt-6">
            <div className="text-center">
              <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                API Key Created Successfully!
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mb-3">
                This is the only time you'll see the full key. Copy it now:
              </p>
              <div className="flex items-center gap-2 justify-center">
                <code className="bg-white dark:bg-gray-800 px-3 py-2 rounded border text-sm">
                  {copiedKey}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(copiedKey, 'new')}
                >
                  <CopyIcon className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                Key has been copied to clipboard
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
