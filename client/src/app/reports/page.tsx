'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { Upload } from 'lucide-react';
import useStore from '@/store';
import { apiCall } from '@/lib/utils';

export default function ReportsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form fields
  const [issue, setIssue] = useState('');
  const [email, setEmail] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  // Get user from store
  const user = useStore((state) => state.user);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!issue) {
      toast({
        variant: "destructive",
        title: "Issue description required",
        description: "Please describe the issue you're reporting.",
      });
      return;
    }
    
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please provide an email where we can contact you.",
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // In a real app, submit via API
      // const formData = new FormData();
      // formData.append('issue', issue);
      // formData.append('email', email);
      // if (file) formData.append('evidence', file);
      
      // await fetch('/api/reports/submit', {
      //   method: 'POST',
      //   body: formData,
      // });
      
      // For demo, simulate success
      setTimeout(() => {
        toast({
          title: "Report Submitted",
          description: "Thank you for your report. We'll investigate and get back to you soon.",
        });
        
        // Reset form
        setIssue('');
        setEmail('');
        setFile(null);
        
        setLoading(false);
      }, 1500);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: "Failed to submit your report. Please try again.",
      });
      setLoading(false);
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold mb-6">Report an Issue</h1>
      
      <div className="rounded-xl border bg-card p-6 shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="issue">Describe the Issue</Label>
            <Textarea
              id="issue"
              value={issue}
              onChange={(e) => setIssue(e.target.value)}
              placeholder="Please provide details about the issue you're experiencing"
              rows={6}
              className="resize-none"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={email || (user?.email || '')}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              required
            />
            <p className="text-sm text-muted-foreground">
              We'll use this email to follow up on your report.
            </p>
          </div>
          
          <div className="space-y-2">
            <Label>Evidence (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">
                  {file 
                    ? `Selected file: ${file.name}`
                    : 'Upload a screenshot or video of the issue'
                  }
                </p>
                
                <div>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="inline-flex items-center justify-center h-9 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90">
                      {file ? 'Change File' : 'Select File'}
                    </div>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Accepted file types: JPEG, PNG, GIF, MP4 (max 10MB)
            </p>
          </div>
          
          <Button 
            type="submit" 
            className="w-full md:w-auto"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Report'}
          </Button>
        </form>
      </div>
    </div>
  );
}