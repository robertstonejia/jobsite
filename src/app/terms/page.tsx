'use client'

import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">利用契約</h1>

          <div className="bg-white rounded-lg shadow p-6 space-y-6">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第1条（目的）</h2>
              <p className="text-gray-700 leading-relaxed">
                本利用規約は、seekjob（以下「当社」）が提供する求人マッチングサービス（以下「本サービス」）の利用条件を定めるものです。
                本サービスを利用する全ての利用者は、本規約に同意したものとみなされます。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第2条（利用登録）</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                本サービスの利用を希望する方は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することで利用登録が完了します。
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>登録情報は正確かつ最新の情報を提供してください</li>
                <li>1人につき1つのアカウントのみ登録可能です</li>
                <li>18歳未満の方は保護者の同意が必要です</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第3条（禁止事項）</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                利用者は、本サービスの利用にあたり、以下の行為をしてはなりません。
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>虚偽の情報を登録する行為</li>
                <li>他の利用者または第三者の知的財産権を侵害する行為</li>
                <li>本サービスのネットワークまたはシステムに過度な負荷をかける行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>他の利用者の情報を収集する行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第4条（個人情報の取扱い）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、利用者の個人情報を適切に管理し、個人情報保護法その他の関連法令を遵守します。
                個人情報の取扱いの詳細については、プライバシーポリシーをご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第5条（サービスの変更・停止）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、利用者への事前通知なく、本サービスの内容を変更、または提供を停止することができます。
                これによって利用者に生じた損害について、当社は一切の責任を負いません。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第6条（料金およびプラン）</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                本サービスの有料プラン（サブスクリプション、スカウト機能など）に関する料金は、当社のウェブサイトに掲載されている価格表に従います。
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">料金プラン詳細</h3>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">1. 基本プラン（月額会員）</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 text-sm">
                    <li>料金: PayPay - ¥3,680/月、WeChat Pay/Alipay - 180元/月</li>
                    <li>機能: 求人掲載、応募者とのメッセージング、応募通知メール、企業プロフィールページ</li>
                    <li>IT企業の場合: IT案件情報の投稿（1日5件まで）</li>
                    <li>課金方法: 毎月自動請求</li>
                    <li>解約: いつでも可能（解約後は求人投稿・IT案件投稿不可）</li>
                  </ul>
                </div>

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-800 mb-2">2. スカウト機能</h4>
                  <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4 text-sm">
                    <li>料金: PayPay - ¥3,000/月、WeChat Pay/Alipay - 150元/月</li>
                    <li>前提条件: 基本プランへの登録が必要</li>
                    <li>機能: エンジニア検索、スカウトメッセージの送信、エンジニアプロフィール閲覧</li>
                    <li>有効期間: 30日間</li>
                    <li>課金方法: 買い切り（自動更新なし）</li>
                  </ul>
                </div>
              </div>

              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>料金は事前に明示され、利用者の同意の上で課金されます</li>
                <li className="font-semibold text-red-700">一度購入されたプラン・サービスの料金については、理由の如何を問わず返金はいたしません</li>
                <li>支払方法は、クレジットカード、PayPay、WeChat Pay、Alipay等、当社が指定する方法とします</li>
                <li>料金の変更がある場合は、事前に利用者に通知します</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第7条（免責事項）</h2>
              <p className="text-gray-700 leading-relaxed mb-2">
                当社は、以下の事項について一切の責任を負いません。
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>本サービスに関して利用者が被った損害</li>
                <li>利用者間または利用者と第三者との間で生じたトラブル</li>
                <li>求人情報の正確性、最新性、有用性</li>
                <li>採用選考の結果および雇用契約の内容</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第8条（利用契約の解除）</h2>
              <p className="text-gray-700 leading-relaxed">
                当社は、利用者が本規約に違反した場合、事前通知なく利用契約を解除し、アカウントを削除することができます。
                利用者自身による退会については、
                <Link href="/withdrawal" className="text-primary-500 hover:underline">退会についてページ</Link>
                をご確認ください。
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-3">第9条（準拠法・管轄裁判所）</h2>
              <p className="text-gray-700 leading-relaxed">
                本規約は日本法に準拠し、本規約に起因または関連する一切の紛争については、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
              </p>
            </section>

            <section className="pt-4 border-t">
              <p className="text-sm text-gray-600">
                制定日：2025年1月1日<br />
                最終更新日：2025年1月1日
              </p>
            </section>
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/"
              className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg hover:bg-primary-600 transition font-semibold"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
