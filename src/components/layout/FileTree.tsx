import { useState, useEffect } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  FileText, 
  Folder, 
  FolderOpen,
  Plus,
  MoreHorizontal,
  Loader2,
  FoldVertical
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGitHub } from '@/contexts/GitHubProvider'
import type { FileSystemItem } from '@/types'

interface FileTreeProps {
  items: FileSystemItem[]
  selectedFile?: string
  onFileSelect?: (filePath: string) => void
  onCreateFile?: (parentPath: string) => void
  onCreateFolder?: (parentPath: string) => void
  onCollapseAll?: () => void
}

interface FileTreeItemProps {
  item: FileSystemItem
  level: number
  selectedFile?: string
  onFileSelect?: (filePath: string) => void
  onCreateFile?: (parentPath: string) => void
  onCreateFolder?: (parentPath: string) => void
  forceUpdate?: number
}

function FileTreeItem({ 
  item, 
  level, 
  selectedFile, 
  onFileSelect, 
  onCreateFile, 
  onCreateFolder,
  forceUpdate 
}: FileTreeItemProps) {
  const { expandFolder, saveExpandedState, getExpandedState } = useGitHub()
  const [expanded, setExpanded] = useState(() => getExpandedState(item.path)) // Initialize from saved state
  const [loading, setLoading] = useState(false)
  const [showActions, setShowActions] = useState(false)

  // Update expanded state when forced update changes (for collapse all)
  useEffect(() => {
    setExpanded(getExpandedState(item.path))
  }, [forceUpdate, getExpandedState, item.path])

  const isSelected = selectedFile === item.path
  const isDirectory = item.type === 'directory'
  const hasChildren = item.children && item.children.length > 0
  const hasLoadedChildren = item.loaded === true // Check if actually loaded from GitHub
  const isExpandable = isDirectory // All directories are potentially expandable in lazy loading

  const handleClick = async () => {
    if (isDirectory) {
      console.log('🗂️ Directory clicked:', { path: item.path, expanded, hasLoadedChildren, hasChildren })
      
      if (!expanded) {
        // If folder is not expanded and hasn't loaded children yet, load them
        if (!hasLoadedChildren) {
          console.log('📂 Loading folder contents for:', item.path)
          setLoading(true)
          try {
            await expandFolder(item.path)
            setExpanded(true) // Set expanded after successful loading
            saveExpandedState(item.path, true) // Save expanded state
            console.log('✅ Folder loaded and expanded:', item.path)
          } catch (error) {
            console.error('❌ Failed to expand folder:', error)
          } finally {
            setLoading(false)
          }
        } else {
          console.log('📂 Expanding already loaded folder:', item.path)
          setExpanded(true)
          saveExpandedState(item.path, true) // Save expanded state
        }
      } else {
        console.log('📁 Collapsing folder:', item.path)
        setExpanded(false)
        saveExpandedState(item.path, false) // Save collapsed state
      }
    } else {
      console.log('📄 File clicked:', item.path)
      onFileSelect?.(item.path)
    }
  }

  const paddingLeft = level * 12 + 8

  return (
    <div>
      <div
        className={cn(
          "group flex items-center py-1.5 px-2 text-sm cursor-pointer hover:bg-accent rounded-md mx-1 transition-colors",
          isSelected && "bg-accent text-accent-foreground",
          "relative"
        )}
        style={{ paddingLeft }}
        onClick={handleClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        {/* Expansion icon for directories */}
        <div className="w-4 h-4 flex items-center justify-center mr-1">
          {isExpandable && (
            loading ? (
              <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
            ) : hasChildren ? (
              expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <ChevronRight className="h-3 w-3" />
            )
          )}
        </div>

        {/* File/Folder icon */}
        <div className="w-4 h-4 flex items-center justify-center mr-2">
          {isDirectory ? (
            loading ? (
              <FolderOpen className="h-4 w-4 text-blue-400 animate-pulse" />
            ) : expanded ? (
              <FolderOpen className="h-4 w-4 text-blue-500" />
            ) : hasLoadedChildren ? (
              <Folder className="h-4 w-4 text-blue-500" />
            ) : (
              <Folder className="h-4 w-4 text-blue-400" />
            )
          ) : (
            <FileText className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* File/Folder name */}
        <span className="flex-1 truncate">
          {item.name}
          {loading && isDirectory && (
            <span className="ml-2 text-xs text-muted-foreground">(loading...)</span>
          )}
        </span>

        {/* Actions */}
        {showActions && isDirectory && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                onCreateFile?.(item.path)
              }}
              title="New file"
            >
              <Plus className="h-3 w-3" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation()
                // TODO: Show more actions menu
              }}
              title="More actions"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Children */}
      {isDirectory && expanded && hasChildren && (
        <div className="ml-2">
          {item.children!.map((child) => (
            <FileTreeItem
              key={child.path}
              item={child}
              level={level + 1}
              selectedFile={selectedFile}
              onFileSelect={onFileSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              forceUpdate={forceUpdate}
            />
          ))}
        </div>
      )}
      
      {/* Show placeholder when directory is expanded but has no children yet */}
      {isDirectory && expanded && !hasChildren && !loading && hasLoadedChildren && (
        <div className="ml-6 py-1 text-xs text-muted-foreground italic">
          Empty folder
        </div>
      )}
      
      {/* Show loading placeholder when expanded but not loaded yet */}
      {isDirectory && expanded && !hasLoadedChildren && !loading && (
        <div className="ml-6 py-1 text-xs text-muted-foreground italic">
          Click to load contents...
        </div>
      )}
    </div>
  )
}

export function FileTree({ 
  items, 
  selectedFile, 
  onFileSelect, 
  onCreateFile, 
  onCreateFolder,
  onCollapseAll 
}: FileTreeProps) {
  const { saveExpandedState } = useGitHub()
  const [forceUpdate, setForceUpdate] = useState(0)

  const handleCollapseAll = () => {
    // Recursively collapse all folders and save their state
    const collapseRecursively = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (item.type === 'directory') {
          saveExpandedState(item.path, false)
          if (item.children) {
            collapseRecursively(item.children)
          }
        }
      })
    }
    
    collapseRecursively(items)
    
    // Force re-render of all FileTreeItem components
    setForceUpdate(prev => prev + 1)
    
    onCollapseAll?.()
  }

  return (
    <div className="py-2">
      <div className="flex items-center justify-between px-4 py-2 text-sm font-medium text-muted-foreground">
        <span>Files</span>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleCollapseAll}
            title="Collapse all folders"
          >
            <FoldVertical className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onCreateFile?.('/')}
            title="New file"
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => onCreateFolder?.('/')}
            title="New folder"
          >
            <Folder className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-0.5">
        {items.map((item) => (
          <FileTreeItem
            key={item.path}
            item={item}
            level={0}
            selectedFile={selectedFile}
            onFileSelect={onFileSelect}
            onCreateFile={onCreateFile}
            onCreateFolder={onCreateFolder}
            forceUpdate={forceUpdate}
          />
        ))}
      </div>
    </div>
  )
}
