"use client"

import React, { useState } from "react"
import { Eye, EyeOff, Globe, Linkedin, Twitter, Facebook, Instagram, Youtube, Music } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toggleSocialVisibility } from "@/app/certificados/social-visibility-actions"
import { useToast } from "@/components/ui/use-toast"

const ICONS: Record<string, React.ReactElement> = {
  linkedin: <Linkedin className="w-4 h-4" />,
  twitter: <Twitter className="w-4 h-4" />,
  facebook: <Facebook className="w-4 h-4" />,
  instagram: <Instagram className="w-4 h-4" />,
  youtube: <Youtube className="w-4 h-4" />,
  tiktok: <Music className="w-4 h-4" />,
  site: <Globe className="w-4 h-4" />,
}

interface Props {
  certId?: string // necessário quando editable
  links: Record<string, string>
  visibility: Record<string, boolean | undefined>
  editable?: boolean
}

export default function SocialLinksDisplay({ certId, links, visibility, editable = false }: Props) {
  const { toast } = useToast()
  const [localVis, setLocalVis] = useState<Record<string, boolean | undefined>>(visibility)

  const handleToggle = async (key: string) => {
    const current = localVis[key] !== false // undefined -> true
    const newVal = !current
    setLocalVis({ ...localVis, [key]: newVal })
    if (certId) {
      try {
        await toggleSocialVisibility({ certId, key, visible: newVal })
        toast({ title: newVal ? "Link visível" : "Link oculto", variant: "success" })
      } catch (err: any) {
        toast({ title: "Erro ao alterar", description: err.message, variant: "destructive" })
      }
    }
  }

  return (
    <div className="space-y-2 w-full">
      {Object.entries(links).map(([key, url]) => {
        const netKey = key.split("_")[0]
        const visible = localVis[key] !== false
        if (!visible && !editable) return null // público, não mostra ocultos
        return (
          <div key={key} className={`flex items-center gap-2 text-sm break-all ${visible ? "text-gray-800" : "text-gray-400"}`}>
            {ICONS[netKey] ?? <Globe className="w-4 h-4" />}
            <a href={url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
              {url}
            </a>
            {editable && (
              <Button size="icon" variant="ghost" onClick={() => handleToggle(key)}>
                {visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              </Button>
            )}
          </div>
        )
      })}
    </div>
  )
}
