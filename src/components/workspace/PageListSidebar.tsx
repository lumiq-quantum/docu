"use client";

import type { PageResponse } from '@/types/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { FileText, Loader2 } from 'lucide-react';

interface PageListSidebarProps {
  pages: PageResponse[] | undefined;
  isLoading: boolean;
  selectedPageNumber: number | null;
  onSelectPage: (pageNumber: number) => void;
  className?: string;
}

export function PageListSidebar({
  pages,
  isLoading,
  selectedPageNumber,
  onSelectPage,
  className,
}: PageListSidebarProps) {
  return (
    <aside className={cn("w-64 border-r bg-card p-4 flex-shrink-0", className)}>
      <h2 className="text-lg font-semibold mb-4 text-card-foreground">Document Pages</h2>
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
             <div key={i} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 animate-pulse">
                <FileText className="h-4 w-4 text-muted-foreground/50" />
                <div className="h-4 w-20 bg-muted-foreground/30 rounded-sm" />
             </div>
          ))}
        </div>
      ) : pages && pages.length > 0 ? (
        <ScrollArea className="h-[calc(100vh-180px)] pr-2"> {/* Adjust height as needed */}
          <ul className="space-y-1">
            {pages
              .sort((a, b) => a.page_number - b.page_number)
              .map((page) => (
              <li key={page.id}>
                <Button
                  variant={selectedPageNumber === page.page_number ? 'secondary' : 'ghost'}
                  className={cn(
                    "w-full justify-start px-3 py-2 text-sm",
                    selectedPageNumber === page.page_number && "font-semibold bg-primary/10 text-primary hover:bg-primary/20"
                  )}
                  onClick={() => onSelectPage(page.page_number)}
                  aria-current={selectedPageNumber === page.page_number ? "page" : undefined}
                >
                  <FileText className="mr-2 h-4 w-4 flex-shrink-0" />
                  Page {page.page_number}
                </Button>
              </li>
            ))}
          </ul>
        </ScrollArea>
      ) : (
        <p className="text-sm text-muted-foreground">No pages found for this project.</p>
      )}
    </aside>
  );
}
