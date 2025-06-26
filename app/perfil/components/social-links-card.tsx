"use client"

import React from "react"

import { useState } from "react"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Trash2, Linkedin, Twitter, Facebook, Instagram, Youtube, Music, Globe } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { addSocialLink, removeSocialLink } from "../social-actions"

export const SOCIAL_OPTIONS = [
  { key: "linkedin", label: "LinkedIn", prefix: "https://www.linkedin.com/in/", placeholder: "seu-id" },
  { key: "twitter", label: "Twitter", prefix: "https://x.com/", placeholder: "seu-usuario" },
  { key: "facebook", label: "Facebook", prefix: "https://www.facebook.com/", placeholder: "seu.perfil" },
  { key: "instagram", label: "Instagram", prefix: "https://www.instagram.com/", placeholder: "seu_usuario" },
  { key: "youtube", label: "YouTube", prefix: "https://www.youtube.com/", placeholder: "@seucanal" },
  { key: "tiktok", label: "TikTok", prefix: "https://www.tiktok.com/@", placeholder: "seuusuario" },
  { key: "site", label: "Site", prefix: "", placeholder: "exemplo.com" },
] as const

const ICON_MAP: Record<string, React.ReactElement> = {
  linkedin: <Linkedin className="w-4 h-4 text-blue-400" />,
  twitter: <Twitter className="w-4 h-4 text-sky-400" />,
  facebook: <Facebook className="w-4 h-4 text-blue-500" />,
  instagram: <Instagram className="w-4 h-4 text-pink-400" />,
  youtube: <Youtube className="w-4 h-4 text-red-500" />,
  tiktok: <Music className="w-4 h-4 text-white" />,
  site: <Globe className="w-4 h-4 text-green-400" />,
}

type SocialKey = typeof SOCIAL_OPTIONS[number]["key"]

interface SocialLinksCardProps {
  userId: string
  initialLinks: Record<string, string>
  onUpdate?: (links: Record<string, string>) => void
}

export default function SocialLinksCard({ userId, initialLinks, onUpdate }: SocialLinksCardProps) {
  const [links, setLinks] = useState<Record<string, string>>(initialLinks)
  const [network, setNetwork] = useState<SocialKey>("linkedin")
  const [identifier, setIdentifier] = useState("")
  const { toast } = useToast()

  const currentOption = SOCIAL_OPTIONS.find((opt) => opt.key === network)!

  const handleAdd = async () => {
    if (!identifier.trim()) return
    const fullUrl = `${currentOption.prefix}${identifier.trim()}`
    const key = `${network}_${Date.now()}`
    const result = await addSocialLink(userId, key, fullUrl)
    if (result.success) {
      const updated = { ...links, [key]: fullUrl }
      setLinks(updated)
      onUpdate?.(updated)
      setIdentifier("")
      toast({ title: "Link adicionado!", variant: "success" })
    } else {
      toast({ title: "Erro ao adicionar", description: result.error, variant: "destructive" })
    }
  }

  const handleRemove = async (removeKey: string) => {
    const result = await removeSocialLink(userId, removeKey)
    if (result.success) {
      const updated = { ...links }
      delete updated[removeKey]
      setLinks(updated)
      onUpdate?.(updated)
      toast({ title: "Link removido!", variant: "success" })
    } else {
      toast({ title: "Erro ao remover", description: result.error, variant: "destructive" })
    }
  }

  return (
    <div className="bg-[#1c2130]/60 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 mt-8 mb-10">
      <h2 className="text-xl font-semibold text-white mb-6">Redes Sociais</h2>

      {/* Adicionar */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end mb-8">
        <div className="w-full md:w-40">
          <Label className="text-white mb-1 block">Rede</Label>
          <Select value={network} onValueChange={(val) => setNetwork(val as SocialKey)}>
            <SelectTrigger className="w-full bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-white hover:bg-slate-800/70">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800/90 backdrop-blur-sm border border-slate-700/50 text-white">
              {SOCIAL_OPTIONS.map((opt) => (
                <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1 w-full">
          <Label className="text-white mb-1 block">Identificador</Label>
          <div className="flex items-center">
            {currentOption.prefix && (
              <span className="text-sm bg-[#111827] text-gray-400 px-3 py-2 rounded-l-md border border-r-0 border-gray-600 select-none">
                {currentOption.prefix}
              </span>
            )}
            <Input
              placeholder={currentOption.placeholder}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className={`${currentOption.prefix ? "rounded-l-none" : ""} bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-white placeholder:text-slate-400`}
            />
          </div>
        </div>
        <Button onClick={handleAdd} className="mt-4 md:mt-0">Adicionar</Button>
      </div>

      {/* Lista existente */}
      <div className="mt-8">
        {Object.keys(links).map((key) => {
          const netKey = key.split("_")[0] as SocialKey
          return (
            <div key={key} className="flex items-center gap-3 mb-4">
              {ICON_MAP[netKey] ?? <Globe className="w-4 h-4 text-green-400" />}
              <span className="text-white">{links[key]}</span>
              <Button onClick={() => handleRemove(key)} className="ml-auto">
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
