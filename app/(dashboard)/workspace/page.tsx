'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Plus, Mail, Shield, Eye, Crown, Trash2, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import SimpleDropdown from '@/components/ui/SimpleDropdown'

const ROLE_CONFIG = {
  owner:   { label: 'Owner',   icon: Crown,  color: '#F59E0B', desc: 'Full access' },
  analyst: { label: 'Analyst', icon: Shield, color: '#6366F1', desc: 'Upload & edit' },
  viewer:  { label: 'Viewer',  icon: Eye,    color: '#71717A', desc: 'Read only' },
}

export default function WorkspacePage() {
  const [workspace, setWorkspace] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [workspaceName, setWorkspaceName] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'analyst' | 'viewer'>('analyst')
  const [inviting, setInviting] = useState(false)
  const [inviteLink, setInviteLink] = useState('')
  const [copied, setCopied] = useState(false)

  const loadWorkspace = async () => {
    const res = await fetch('/api/workspace')
    const data = await res.json()
    setWorkspace(data.workspace)
    setLoading(false)
  }

  useEffect(() => { loadWorkspace() }, [])

  const createWorkspace = async () => {
    if (!workspaceName.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/workspace', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: workspaceName }),
      })
      if (!res.ok) throw new Error('Failed')
      toast.success('Workspace created!')
      await loadWorkspace()
    } catch {
      toast.error('Failed to create workspace')
    } finally {
      setCreating(false)
    }
  }

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const res = await fetch('/api/workspace/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setInviteLink(data.inviteLink)
      setInviteEmail('')
      toast.success('Invite created!')
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to send invite')
    } finally {
      setInviting(false)
    }
  }

  const removeMember = async (memberId: string) => {
    await fetch('/api/workspace/members', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId }),
    })
    toast.success('Member removed')
    await loadWorkspace()
  }

  const changeRole = async (memberId: string, role: string) => {
    await fetch('/api/workspace/members', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberId, role }),
    })
    toast.success('Role updated')
    await loadWorkspace()
  }

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="p-5"><div className="h-32 bg-bg-card border border-border rounded-xl animate-pulse" /></div>

  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.22 }} className="p-5 space-y-5">

      <div>
        <h1 className="text-xl font-semibold text-text flex items-center gap-2">
          <Users size={20} className="text-accent" />
          Workspace
        </h1>
        <p className="text-text-muted text-sm mt-0.5">Invite teammates and manage access</p>
      </div>

      {/* Create workspace */}
      {!workspace && (
        <div className="bg-bg-card border border-border border-dashed rounded-xl p-8 text-center">
          <Users size={40} className="text-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-text font-semibold mb-2">Create a Workspace</p>
          <p className="text-text-muted text-sm mb-6 max-w-sm mx-auto">Workspaces let you collaborate with your team on shared datasets and dashboards.</p>
          <div className="flex gap-2 max-w-sm mx-auto">
            <input
              value={workspaceName}
              onChange={e => setWorkspaceName(e.target.value)}
              placeholder="e.g. Marketing Team"
              className="flex-1 bg-bg-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
              onKeyDown={e => e.key === 'Enter' && createWorkspace()}
            />
            <motion.button whileTap={{ scale: 0.97 }} onClick={createWorkspace} disabled={creating || !workspaceName.trim()}
              className="bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
              {creating ? 'Creating…' : 'Create'}
            </motion.button>
          </div>
        </div>
      )}

      {workspace && (
        <>
          {/* Workspace info */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-text-muted mb-1">Workspace</p>
                <h2 className="text-lg font-semibold text-text">{workspace.name}</h2>
                <p className="text-sm text-text-muted mt-0.5">{workspace.members.length} member{workspace.members.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-accent-subtle flex items-center justify-center">
                <Users size={20} className="text-accent" />
              </div>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-text">Members</h3>
            </div>
            <div className="divide-y divide-border">
              {workspace.members.map((member: any) => {
                const roleConf = ROLE_CONFIG[member.role as keyof typeof ROLE_CONFIG] ?? ROLE_CONFIG.viewer
                const RoleIcon = roleConf.icon
                return (
                  <div key={member.userId ?? member.email} className="flex items-center gap-3 p-4 hover:bg-bg-hover transition-colors">
                    <div className="w-8 h-8 rounded-full bg-accent-subtle flex items-center justify-center flex-shrink-0 text-accent font-semibold text-sm">
                      {(member.name ?? member.email ?? '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text truncate">{member.name ?? member.email}</p>
                      <p className="text-xs text-text-muted truncate">{member.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium"
                        style={{ background: roleConf.color + '20', color: roleConf.color }}>
                        <RoleIcon size={10} />
                        {roleConf.label}
                      </span>
                      {member.role !== 'owner' && (
                        <>
                          <SimpleDropdown
                            label="Change role"
                            options={['analyst', 'viewer']}
                            value={member.role}
                            onChange={role => changeRole(member.userId ?? member.email, role)}
                          />
                          <motion.button whileTap={{ scale: 0.97 }}
                            onClick={() => removeMember(member.userId ?? member.email)}
                            className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </motion.button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Invite form */}
          <div className="bg-bg-card border border-border rounded-xl p-5">
            <h3 className="text-sm font-semibold text-text mb-4">Invite a Team Member</h3>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="bg-bg-hover border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                  onKeyDown={e => e.key === 'Enter' && sendInvite()}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted">Role</label>
                <SimpleDropdown
                  label="Select role"
                  options={['analyst', 'viewer']}
                  value={inviteRole}
                  onChange={v => setInviteRole(v as any)}
                />
              </div>
              <motion.button whileTap={{ scale: 0.97 }} onClick={sendInvite}
                disabled={inviting || !inviteEmail.trim()}
                className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-60">
                <Plus size={14} /> {inviting ? 'Inviting…' : 'Send Invite'}
              </motion.button>
            </div>

            {/* Role descriptions */}
            <div className="flex gap-4 mt-4">
              {(Object.entries(ROLE_CONFIG) as [string, typeof ROLE_CONFIG[keyof typeof ROLE_CONFIG]][]).filter(([k]) => k !== 'owner').map(([key, conf]) => {
                const ConfIcon = conf.icon
                return (
                  <div key={key} className="flex items-center gap-2 text-xs text-text-muted">
                    <ConfIcon size={12} style={{ color: conf.color }} />
                    <span><span className="font-medium text-text">{conf.label}:</span> {conf.desc}</span>
                  </div>
                )
              })}
            </div>

            {/* Invite link */}
            <AnimatePresence>
              {inviteLink && (
                <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
                  <p className="text-xs text-success font-medium mb-2 flex items-center gap-1">
                    <Mail size={12} /> Invite link created — share this with your teammate:
                  </p>
                  <div className="flex gap-2">
                    <code className="flex-1 text-xs text-text-muted bg-bg-hover px-2 py-1 rounded truncate">
                      {inviteLink}
                    </code>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={copyLink}
                      className="flex items-center gap-1 px-3 py-1 bg-success/20 text-success rounded-lg text-xs font-medium transition-colors flex-shrink-0">
                      {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
                    </motion.button>
                  </div>
                  <p className="text-[10px] text-text-muted mt-2">Link expires in 7 days</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.div>
  )
}
