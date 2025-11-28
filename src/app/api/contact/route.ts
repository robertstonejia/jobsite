import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

const contactSchema = z.object({
  name: z.string().min(1, 'お名前は必須です'),
  email: z.string().email('有効なメールアドレスを入力してください'),
  company: z.string().optional(),
  phoneNumber: z.string().optional(),
  subject: z.string().min(1, '件名は必須です'),
  message: z.string().min(10, 'お問い合わせ内容は10文字以上で入力してください'),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validatedData = contactSchema.parse(body)

    // お問い合わせをデータベースに保存
    const contactInquiry = await prisma.contactInquiry.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        company: validatedData.company,
        phoneNumber: validatedData.phoneNumber,
        subject: validatedData.subject,
        message: validatedData.message,
      },
    })

    // 管理者に通知メールを送信
    const adminEmail = 'kahyousei@gmail.com'
    if (adminEmail) {
      const emailContent = {
        to: adminEmail,
        subject: `[TechJob] 新しいお問い合わせ: ${validatedData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">新しいお問い合わせ</h2>

            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <p><strong>お名前:</strong> ${validatedData.name}</p>
              <p><strong>メールアドレス:</strong> ${validatedData.email}</p>
              ${validatedData.company ? `<p><strong>会社名:</strong> ${validatedData.company}</p>` : ''}
              ${validatedData.phoneNumber ? `<p><strong>電話番号:</strong> ${validatedData.phoneNumber}</p>` : ''}
              <p><strong>件名:</strong> ${validatedData.subject}</p>
            </div>

            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #333; margin-top: 0;">お問い合わせ内容:</h3>
              <p style="white-space: pre-wrap;">${validatedData.message}</p>
            </div>

            <p style="color: #666; font-size: 12px;">
              お問い合わせID: ${contactInquiry.id}<br>
              受信日時: ${new Date(contactInquiry.createdAt).toLocaleString('ja-JP')}
            </p>
          </div>
        `,
        text: `
新しいお問い合わせ

お名前: ${validatedData.name}
メールアドレス: ${validatedData.email}
${validatedData.company ? `会社名: ${validatedData.company}` : ''}
${validatedData.phoneNumber ? `電話番号: ${validatedData.phoneNumber}` : ''}
件名: ${validatedData.subject}

お問い合わせ内容:
${validatedData.message}

お問い合わせID: ${contactInquiry.id}
受信日時: ${new Date(contactInquiry.createdAt).toLocaleString('ja-JP')}
        `,
      }

      await sendEmail(emailContent)
    }

    // ユーザーに自動返信メールを送信
    const autoReplyEmail = {
      to: validatedData.email,
      subject: `【TechJob】お問い合わせを受け付けました`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">お問い合わせありがとうございます</h2>
          <p>${validatedData.name}様</p>
          <p>この度はTechJobにお問い合わせいただき、誠にありがとうございます。</p>
          <p>以下の内容でお問い合わせを受け付けました。</p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>件名:</strong> ${validatedData.subject}</p>
            <p><strong>お問い合わせ内容:</strong></p>
            <p style="white-space: pre-wrap;">${validatedData.message}</p>
          </div>

          <p>担当者より3営業日以内にご返信いたします。</p>
          <p>今しばらくお待ちくださいますようお願いいたします。</p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 12px;">
            このメールは自動送信されています。<br>
            お問い合わせID: ${contactInquiry.id}<br>
            TechJob運営チーム
          </p>
        </div>
      `,
      text: `
お問い合わせありがとうございます

${validatedData.name}様

この度はTechJobにお問い合わせいただき、誠にありがとうございます。
以下の内容でお問い合わせを受け付けました。

件名: ${validatedData.subject}

お問い合わせ内容:
${validatedData.message}

担当者より3営業日以内にご返信いたします。
今しばらくお待ちくださいますようお願いいたします。

---
このメールは自動送信されています。
お問い合わせID: ${contactInquiry.id}
TechJob運営チーム
      `,
    }

    await sendEmail(autoReplyEmail)

    return NextResponse.json(
      {
        success: true,
        message: 'お問い合わせを受け付けました',
        inquiryId: contactInquiry.id,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    console.error('Contact inquiry error:', error)
    return NextResponse.json(
      { error: 'お問い合わせの送信に失敗しました' },
      { status: 500 }
    )
  }
}
