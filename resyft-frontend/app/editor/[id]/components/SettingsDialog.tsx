"use client"

import { Button } from "../../../../components/ui/button"
import { Input } from "../../../../components/ui/input"
import { Label } from "../../../../components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../../components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select"
import { Switch } from "../../../../components/ui/switch"
import { useCADStore } from "../../../../lib/cad/store"

interface SettingsDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ projectId, open, onOpenChange }: SettingsDialogProps) {
  const { projects, updateProject } = useCADStore()
  const project = projects.find(p => p.id === projectId)

  if (!project) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            Configure your CAD project settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={project.name}
              onChange={(e) => updateProject(projectId, { name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectDesc">Description</Label>
            <Input
              id="projectDesc"
              value={project.description}
              onChange={(e) => updateProject(projectId, { description: e.target.value })}
              placeholder="Add a description..."
            />
          </div>

          <div className="space-y-2">
            <Label>Units</Label>
            <Select
              value={project.settings.units}
              onValueChange={(value: 'mm' | 'cm' | 'm' | 'in') =>
                updateProject(projectId, {
                  settings: { ...project.settings, units: value }
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mm">Millimeters (mm)</SelectItem>
                <SelectItem value="cm">Centimeters (cm)</SelectItem>
                <SelectItem value="m">Meters (m)</SelectItem>
                <SelectItem value="in">Inches (in)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Grid Size</Label>
            <Input
              type="number"
              value={project.settings.gridSize}
              onChange={(e) =>
                updateProject(projectId, {
                  settings: { ...project.settings, gridSize: Number(e.target.value) }
                })
              }
              min={1}
              max={100}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="snapGrid">Snap to Grid</Label>
            <Switch
              id="snapGrid"
              checked={project.settings.snapToGrid}
              onCheckedChange={(checked) =>
                updateProject(projectId, {
                  settings: { ...project.settings, snapToGrid: checked }
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showAxes">Show Axes</Label>
            <Switch
              id="showAxes"
              checked={project.settings.showAxes}
              onCheckedChange={(checked) =>
                updateProject(projectId, {
                  settings: { ...project.settings, showAxes: checked }
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="showGrid">Show Grid</Label>
            <Switch
              id="showGrid"
              checked={project.settings.showGrid}
              onCheckedChange={(checked) =>
                updateProject(projectId, {
                  settings: { ...project.settings, showGrid: checked }
                })
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} className="bg-teal-600 hover:bg-teal-700">
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
