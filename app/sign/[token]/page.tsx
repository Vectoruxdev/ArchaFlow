"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Spinner } from "@/components/design-system"
import { Button } from "@/components/ui/button"
import { toast } from "@/lib/toast"
import SignatureCanvas from "react-signature-canvas"

interface ContractData {
  name: string
  signerName: string
  content: any
  type: "rich_text" | "pdf"
  pdfUrl: string | null
  status: string
}

export default function SignContractPage() {
  const params = useParams()
  const token = params.token as string
  const sigCanvasRef = useRef<SignatureCanvas>(null)

  const [contract, setContract] = useState<ContractData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [signing, setSigning] = useState(false)
  const [signed, setSigned] = useState(false)
  const [hasSig, setHasSig] = useState(false)

  useEffect(() => {
    loadContract()
  }, [token])

  const loadContract = async () => {
    try {
      const res = await fetch(`/api/contracts/sign?token=${token}`)
      if (!res.ok) {
        const body = await res.json()
        setError(body.error || "Contract not found")
        return
      }
      const data = await res.json()
      if (data.status === "signed") {
        setSigned(true)
      }
      setContract(data)
    } catch {
      setError("Failed to load contract")
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    if (!sigCanvasRef.current || sigCanvasRef.current.isEmpty()) {
      toast.error("Please draw your signature above")
      return
    }

    setSigning(true)
    try {
      const signatureData = sigCanvasRef.current.toDataURL("image/png")

      const res = await fetch("/api/contracts/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          signatureData,
        }),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to sign")
      }

      setSigned(true)
      toast.success("Contract signed successfully!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSigning(false)
    }
  }

  const clearSignature = () => {
    sigCanvasRef.current?.clear()
    setHasSig(false)
  }

  // Render rich text content from Tiptap JSON
  const renderContent = (json: any): string => {
    if (!json || !json.content) return ""

    const renderNode = (node: any): string => {
      if (node.type === "text") {
        let text = node.text || ""
        if (node.marks) {
          for (const mark of node.marks) {
            if (mark.type === "bold") text = `<strong>${text}</strong>`
            if (mark.type === "italic") text = `<em>${text}</em>`
          }
        }
        return text
      }

      const children = (node.content || []).map(renderNode).join("")

      switch (node.type) {
        case "paragraph":
          return `<p>${children || "&nbsp;"}</p>`
        case "heading":
          const level = node.attrs?.level || 1
          return `<h${level}>${children}</h${level}>`
        case "bulletList":
          return `<ul>${children}</ul>`
        case "orderedList":
          return `<ol>${children}</ol>`
        case "listItem":
          return `<li>${children}</li>`
        case "doc":
          return children
        default:
          return children
      }
    }

    return renderNode(json)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--af-bg-canvas]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--af-bg-canvas] p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[--af-danger-bg] flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-[--af-danger-text]" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight mb-2">Unable to Load Contract</h1>
          <p className="text-[--af-text-muted] text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[--af-bg-canvas] p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[--af-success-bg] flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-[--af-success-text]" />
          </div>
          <h1 className="text-xl font-display font-bold tracking-tight mb-2">Contract Signed</h1>
          <p className="text-[--af-text-muted] text-sm">
            {contract?.name} has been successfully signed. A confirmation email has been sent.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[--af-bg-canvas]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[--af-bg-surface] border-b border-[--af-border-default]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-warm-900 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rotate-45" />
            </div>
            <span className="font-semibold text-sm">ArchaFlow</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[--af-text-muted]">
            <AlertTriangle className="w-4 h-4" />
            Review carefully before signing
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Contract info */}
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold tracking-tight">{contract?.name}</h1>
          <p className="text-sm text-[--af-text-muted] mt-1">
            Prepared for {contract?.signerName}
          </p>
        </div>

        {/* Contract content */}
        <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-8 mb-8 shadow-sm">
          {contract?.type === "rich_text" && contract.content ? (
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderContent(contract.content) }}
            />
          ) : contract?.pdfUrl ? (
            <iframe
              src={contract.pdfUrl}
              className="w-full h-[600px] rounded"
              title="Contract PDF"
            />
          ) : (
            <p className="text-[--af-text-muted] text-sm">No contract content available.</p>
          )}
        </div>

        {/* Signature section */}
        <div className="bg-[--af-bg-surface] border border-[--af-border-default] rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-display font-bold mb-1">Your Signature</h2>
          <p className="text-sm text-[--af-text-muted] mb-4">
            Draw your signature in the box below to sign this contract.
          </p>

          <div className="border-2 border-dashed border-[--af-border-default] rounded-lg mb-3 bg-[--af-bg-surface]">
            <SignatureCanvas
              ref={sigCanvasRef}
              canvasProps={{
                className: "w-full h-40",
                style: { width: "100%", height: "160px" },
              }}
              onEnd={() => setHasSig(true)}
            />
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={clearSignature}>
              Clear
            </Button>
            <Button onClick={handleSign} disabled={signing}>
              {signing && <Spinner size="sm" className="mr-2" />}
              Sign Contract
            </Button>
          </div>

          <p className="text-xs text-[--af-text-muted] mt-4">
            By clicking "Sign Contract", you agree that your electronic signature is the
            legal equivalent of your manual/handwritten signature.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[--af-border-default] mt-12 py-6 text-center">
        <p className="text-xs text-[--af-text-muted]">
          Powered by ArchaFlow · Secure electronic signing
        </p>
      </div>
    </div>
  )
}
