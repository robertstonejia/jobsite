'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

interface Skill {
  id: string
  name: string
  category: string
}

interface EngineerSkill {
  id: string
  level: number
  yearsUsed: number | null
  skill: Skill
}

export default function EngineerSkillsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [engineerSkills, setEngineerSkills] = useState<EngineerSkill[]>([])
  const [selectedSkills, setSelectedSkills] = useState<Map<string, { level: number; yearsUsed: number }>>(new Map())

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchData()
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      const [skillsRes, engineerSkillsRes] = await Promise.all([
        fetch('/api/skills'),
        fetch('/api/engineer/skills'),
      ])

      if (skillsRes.ok) {
        const skills = await skillsRes.json()
        setAllSkills(skills)
      }

      if (engineerSkillsRes.ok) {
        const engineerSkills = await engineerSkillsRes.json()
        setEngineerSkills(engineerSkills)

        // Initialize selected skills from existing engineer skills
        const skillMap = new Map()
        engineerSkills.forEach((es: EngineerSkill) => {
          skillMap.set(es.skill.id, {
            level: es.level,
            yearsUsed: es.yearsUsed || 0,
          })
        })
        setSelectedSkills(skillMap)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSkillToggle = (skillId: string) => {
    const newMap = new Map(selectedSkills)
    if (newMap.has(skillId)) {
      newMap.delete(skillId)
    } else {
      newMap.set(skillId, { level: 3, yearsUsed: 1 })
    }
    setSelectedSkills(newMap)
  }

  const handleLevelChange = (skillId: string, level: number) => {
    const newMap = new Map(selectedSkills)
    const current = newMap.get(skillId)
    if (current) {
      newMap.set(skillId, { ...current, level })
      setSelectedSkills(newMap)
    }
  }

  const handleYearsChange = (skillId: string, years: number) => {
    const newMap = new Map(selectedSkills)
    const current = newMap.get(skillId)
    if (current) {
      newMap.set(skillId, { ...current, yearsUsed: years })
      setSelectedSkills(newMap)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const skillsData = Array.from(selectedSkills.entries()).map(([skillId, data]) => ({
        skillId,
        level: data.level,
        yearsUsed: data.yearsUsed,
      }))

      const response = await fetch('/api/engineer/skills', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ skills: skillsData }),
      })

      if (response.ok) {
        alert('スキル情報を更新しました')
        fetchData()
      } else {
        const data = await response.json()
        alert(data.error || 'スキル情報の更新に失敗しました')
      }
    } catch (error) {
      console.error('Error updating skills:', error)
      alert('スキル情報の更新中にエラーが発生しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading || status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex items-center justify-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
        <Footer />
      </>
    )
  }

  // Group skills by category
  const skillsByCategory = allSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, Skill[]>)

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 mb-4"
            >
              ← 戻る
            </button>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">スキル管理</h1>
            <p className="text-gray-600">あなたが持っているスキルを選択し、レベルと経験年数を設定してください</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">選択中のスキル: {selectedSkills.size}件</h2>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? '保存中...' : '保存する'}
              </button>
            </div>

            {selectedSkills.size > 0 && (
              <div className="space-y-3 mb-6">
                {Array.from(selectedSkills.entries()).map(([skillId, data]) => {
                  const skill = allSkills.find(s => s.id === skillId)
                  if (!skill) return null
                  return (
                    <div key={skillId} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">{skill.name}</span>
                        <span className="text-sm text-gray-500 ml-2">({skill.category})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">レベル:</label>
                        <select
                          value={data.level}
                          onChange={(e) => handleLevelChange(skillId, parseInt(e.target.value))}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        >
                          <option value={1}>1 - 初級</option>
                          <option value={2}>2 - 中級下</option>
                          <option value={3}>3 - 中級</option>
                          <option value={4}>4 - 上級</option>
                          <option value={5}>5 - エキスパート</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">経験:</label>
                        <input
                          type="number"
                          min="0"
                          max="50"
                          value={data.yearsUsed}
                          onChange={(e) => handleYearsChange(skillId, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                        <span className="text-sm text-gray-600">年</span>
                      </div>
                      <button
                        onClick={() => handleSkillToggle(skillId)}
                        className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm"
                      >
                        削除
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">{category}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {skills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => handleSkillToggle(skill.id)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                        selectedSkills.has(skill.id)
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {skill.name}
                      {selectedSkills.has(skill.id) && ' ✓'}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex justify-between">
            <button
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-semibold"
            >
              キャンセル
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存する'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
