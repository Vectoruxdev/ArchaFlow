"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Undo,
  Redo,
  Variable,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const BUILT_IN_VARIABLES = [
  "client_name",
  "client_email",
  "client_company",
  "project_name",
  "project_start_date",
  "business_name",
  "today_date",
]

interface Props {
  content: any
  onChange: (content: any) => void
  customVariables?: string[]
}

export function ContractTemplateEditor({ content, onChange, customVariables = [] }: Props) {
  const allVariables = [...BUILT_IN_VARIABLES, ...customVariables]

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Start writing your contract template...",
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[400px] px-6 py-4",
      },
    },
  })

  if (!editor) return null

  const insertVariable = (variable: string) => {
    editor.chain().focus().insertContent(`{{${variable}}}`).run()
  }

  return (
    <div className="border border-[--af-border-default] rounded-lg overflow-hidden bg-[--af-bg-surface]">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-3 py-2 border-b border-[--af-border-default] bg-[--af-bg-canvas] dark:bg-warm-900 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-[--af-bg-surface-alt] dark:bg-warm-800" : ""}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-[--af-bg-surface-alt] dark:bg-warm-800" : ""}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-[--af-bg-surface-alt] dark:bg-warm-800 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor.isActive("heading", { level: 1 }) ? "bg-[--af-bg-surface-alt] dark:bg-warm-800" : ""}
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor.isActive("heading", { level: 2 }) ? "bg-[--af-bg-surface-alt] dark:bg-warm-800" : ""}
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-[--af-bg-surface-alt] dark:bg-warm-800 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-[--af-bg-surface-alt] dark:bg-warm-800" : ""}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-[--af-bg-surface-alt] dark:bg-warm-800" : ""}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-[--af-bg-surface-alt] dark:bg-warm-800 mx-1" />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="w-4 h-4" />
        </Button>
        <div className="w-px h-5 bg-[--af-bg-surface-alt] dark:bg-warm-800 mx-1" />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Variable className="w-4 h-4 mr-1.5" />
              Insert Variable
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="max-h-64 overflow-y-auto">
            {allVariables.map((v) => (
              <DropdownMenuItem key={v} onClick={() => insertVariable(v)}>
                <code className="text-xs bg-[--af-bg-surface-alt] dark:bg-warm-800 px-1.5 py-0.5 rounded">
                  {`{{${v}}}`}
                </code>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}
