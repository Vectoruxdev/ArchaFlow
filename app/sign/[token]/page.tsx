"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Unable to Load Contract</h1>
          <p className="text-gray-500 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  if (signed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Contract Signed</h1>
          <p className="text-gray-500 text-sm">
            {contract?.name} has been successfully signed. A confirmation email has been sent.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rotate-45" />
            </div>
            <span className="font-semibold text-sm">ArchaFlow</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <AlertTriangle className="w-4 h-4" />
            Review carefully before signing
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Contract info */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">{contract?.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            Prepared for {contract?.signerName}
          </p>
        </div>

        {/* Contract content */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 mb-8 shadow-sm">
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
            <p className="text-gray-400 text-sm">No contract content available.</p>
          )}
        </div>

        {/* Signature section */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Your Signature</h2>
          <p className="text-sm text-gray-500 mb-4">
            Draw your signature in the box below to sign this contract.
          </p>

          <div className="border-2 border-dashed border-gray-200 rounded-lg mb-3 bg-white">
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
              {signing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Sign Contract
            </Button>
          </div>

          <p className="text-xs text-gray-400 mt-4">
            By clicking "Sign Contract", you agree that your electronic signature is the
            legal equivalent of your manual/handwritten signature.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-12 py-6 text-center">
        <p className="text-xs text-gray-400">
          Powered by ArchaFlow · Secure electronic signing
        </p>
      </div>
    </div>
  )
}
