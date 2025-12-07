"use client"

import { BookOpen, Plus, FileText, ChevronRight } from "lucide-react"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./ui/collapsible"

interface ClassItem {
  id: string
  name: string
  course_code: string
  semester: string
  instructor: string
  color_theme: string
  document_count: number
  last_activity: string
}

interface NavClassesProps {
  classes: ClassItem[]
  selectedClassId?: string | null
  onClassSelect?: (classId: string) => void
  onCreateClass?: () => void
}

export function NavClasses({
  classes,
  selectedClassId,
  onClassSelect,
  onCreateClass,
}: NavClassesProps) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center justify-between">
        <span>My Classes</span>
        <button
          onClick={onCreateClass}
          className="ml-auto h-4 w-4 p-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-sm flex items-center justify-center"
          title="Create new class"
        >
          <Plus className="h-3 w-3" />
        </button>
      </SidebarGroupLabel>
      <SidebarMenu>
        {classes.length === 0 ? (
          <SidebarMenuItem>
            <div className="px-2 py-3 text-xs text-sidebar-foreground/60 text-center">
              <BookOpen className="h-8 w-8 mx-auto mb-2 text-sidebar-foreground/40" />
              <p className="mb-2">No classes yet</p>
              <button
                onClick={onCreateClass}
                className="text-sidebar-accent-foreground hover:underline"
              >
                Create your first class
              </button>
            </div>
          </SidebarMenuItem>
        ) : (
          classes.map((classItem) => (
            <Collapsible key={classItem.id} asChild defaultOpen={selectedClassId === classItem.id}>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={classItem.name}
                    isActive={selectedClassId === classItem.id}
                    onClick={() => onClassSelect?.(classItem.id)}
                  >
                    <div
                      className="h-4 w-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: classItem.color_theme }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{classItem.course_code}</div>
                      <div className="text-xs text-sidebar-foreground/60 truncate">
                        {classItem.name}
                      </div>
                    </div>
                    <ChevronRight className="ml-auto transition-transform ui-open:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href={`/class/${classItem.id}/documents`}>
                          <FileText className="h-4 w-4" />
                          <span>Documents ({classItem.document_count})</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton asChild>
                        <a href={`/class/${classItem.id}/upload`}>
                          <Plus className="h-4 w-4" />
                          <span>Upload</span>
                        </a>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ))
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}