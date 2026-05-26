import { Bug } from "lucide-react";
import { useState } from "react";
import { FeedbackReportDialog } from "@/components/feedback/FeedbackReportDialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

/** Botão de feedback fixo no rodapé da sidebar ERP. */
export function FeedbackSidebarButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            type="button"
            tooltip="Enviar feedback"
            onClick={() => setOpen(true)}
            className="text-sidebar-foreground/90 hover:text-white"
          >
            <Bug className="h-4 w-4 shrink-0" />
            <span>Enviar feedback</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>

      <FeedbackReportDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
