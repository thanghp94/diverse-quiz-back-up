import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { Dashboard } from "@uppy/react";
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CenteredObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A centered file upload component that renders as a button and provides a popup dialog interface for
 * file management without dimming the entire page.
 * 
 * Features:
 * - Renders as a customizable button that opens a centered upload dialog
 * - Provides a modal interface for:
 *   - File selection
 *   - File preview
 *   - Upload progress tracking
 *   - Upload status display
 * - Dialog is centered on screen and doesn't dim background
 * 
 * The component uses Uppy under the hood to handle all file upload functionality.
 */
export function CenteredObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 52428800, // 50MB default for debate files
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: CenteredObjectUploaderProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowDialog(false); // Close dialog after successful upload
      })
  );

  return (
    <>
      <Button onClick={() => setShowDialog(true)} className={buttonClassName}>
        {children}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl w-full max-h-[80vh] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Upload File</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-4">
            <Dashboard
              uppy={uppy}
              plugins={[]}
              proudlyDisplayPoweredByUppy={false}
              theme="auto"
              width="100%"
              height={400}
              showProgressDetails={true}
              note={`Files up to ${Math.round(maxFileSize / 1024 / 1024)}MB are allowed`}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}