import { PrismaClient, ReportStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // 営業担当者データの作成
  // 1. 管理者（上長なし）
  const admin = await prisma.salesPerson.create({
    data: {
      name: "山田 太郎",
      email: "yamada@example.com",
      password: "hashed_password_admin", // 本番環境では適切にハッシュ化
      department: "営業部",
      isManager: true,
    },
  });
  console.log(`Created admin: ${admin.name}`);

  // 2. 上長（管理者の部下）
  const manager1 = await prisma.salesPerson.create({
    data: {
      name: "鈴木 一郎",
      email: "suzuki@example.com",
      password: "hashed_password_manager1",
      department: "営業部 第一課",
      isManager: true,
      managerId: admin.id,
    },
  });
  console.log(`Created manager: ${manager1.name}`);

  const manager2 = await prisma.salesPerson.create({
    data: {
      name: "佐藤 花子",
      email: "sato@example.com",
      password: "hashed_password_manager2",
      department: "営業部 第二課",
      isManager: true,
      managerId: admin.id,
    },
  });
  console.log(`Created manager: ${manager2.name}`);

  // 3. 一般営業担当者
  const member1 = await prisma.salesPerson.create({
    data: {
      name: "田中 次郎",
      email: "tanaka@example.com",
      password: "hashed_password_member1",
      department: "営業部 第一課",
      isManager: false,
      managerId: manager1.id,
    },
  });
  console.log(`Created member: ${member1.name}`);

  const member2 = await prisma.salesPerson.create({
    data: {
      name: "高橋 三郎",
      email: "takahashi@example.com",
      password: "hashed_password_member2",
      department: "営業部 第一課",
      isManager: false,
      managerId: manager1.id,
    },
  });
  console.log(`Created member: ${member2.name}`);

  const member3 = await prisma.salesPerson.create({
    data: {
      name: "伊藤 美咲",
      email: "ito@example.com",
      password: "hashed_password_member3",
      department: "営業部 第二課",
      isManager: false,
      managerId: manager2.id,
    },
  });
  console.log(`Created member: ${member3.name}`);

  // 顧客データの作成
  const customers = await prisma.customer.createMany({
    data: [
      {
        customerName: "株式会社ABC",
        address: "東京都渋谷区渋谷1-1-1",
        phone: "03-1234-5678",
        contactPerson: "中村 担当",
      },
      {
        customerName: "XYZ株式会社",
        address: "東京都新宿区新宿2-2-2",
        phone: "03-2345-6789",
        contactPerson: "小林 部長",
      },
      {
        customerName: "DEF Industries",
        address: "大阪府大阪市北区梅田3-3-3",
        phone: "06-3456-7890",
        contactPerson: "加藤 課長",
      },
      {
        customerName: "GHI商事",
        address: "愛知県名古屋市中区栄4-4-4",
        phone: "052-4567-8901",
        contactPerson: "渡辺 主任",
      },
      {
        customerName: "JKLソリューションズ",
        address: "福岡県福岡市博多区博多5-5-5",
        phone: "092-5678-9012",
        contactPerson: "山本 マネージャー",
      },
    ],
  });
  console.log(`Created ${customers.count} customers`);

  // 顧客データを取得（訪問記録作成用）
  const allCustomers = await prisma.customer.findMany();

  if (allCustomers.length < 5) {
    throw new Error("Expected at least 5 customers to be created");
  }

  // 型安全のため変数に代入
  const customer1 = allCustomers[0]!;
  const customer2 = allCustomers[1]!;
  const customer3 = allCustomers[2]!;
  const customer4 = allCustomers[3]!;
  const customer5 = allCustomers[4]!;

  // 日報データの作成（サンプル）
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // 田中さんの日報（提出済）
  const report1 = await prisma.dailyReport.create({
    data: {
      salesPersonId: member1.id,
      reportDate: yesterday,
      problem: "競合他社の新製品が発表され、顧客からの問い合わせが増えている。",
      plan: "競合製品との比較資料を作成し、当社製品の優位性をアピールする。",
      status: ReportStatus.submitted,
      visitRecords: {
        create: [
          {
            customerId: customer1.id,
            visitTime: new Date("1970-01-01T10:00:00"),
            visitPurpose: "定期訪問",
            visitContent:
              "先月納品した製品の稼働状況を確認。特に問題なく稼働中。追加発注の可能性についてヒアリング。",
            visitResult: "来月に追加発注を検討中とのこと",
          },
          {
            customerId: customer2.id,
            visitTime: new Date("1970-01-01T14:00:00"),
            visitPurpose: "新規提案",
            visitContent:
              "新サービスの提案資料を持参して説明。デモンストレーションを実施。",
            visitResult: "興味あり。見積もり依頼を受けた",
          },
        ],
      },
    },
  });
  console.log(`Created report for ${member1.name}`);

  // 田中さんの日報に対する上長コメント
  await prisma.comment.create({
    data: {
      reportId: report1.id,
      salesPersonId: manager1.id,
      commentText:
        "競合対策の資料作成、良い判断です。完成したら共有してください。XYZ株式会社への提案、フォローをお願いします。",
    },
  });
  console.log("Created comment on report");

  // 高橋さんの日報（下書き）
  await prisma.dailyReport.create({
    data: {
      salesPersonId: member2.id,
      reportDate: today,
      problem: null,
      plan: "新規顧客開拓のためのテレアポを実施予定",
      status: ReportStatus.draft,
      visitRecords: {
        create: [
          {
            customerId: customer3.id,
            visitTime: new Date("1970-01-01T11:00:00"),
            visitPurpose: "契約更新",
            visitContent:
              "年間契約の更新について協議。条件面での調整を行った。",
            visitResult: "条件調整中",
          },
        ],
      },
    },
  });
  console.log(`Created draft report for ${member2.name}`);

  // 伊藤さんの日報（確認済）
  const report3 = await prisma.dailyReport.create({
    data: {
      salesPersonId: member3.id,
      reportDate: yesterday,
      problem: "顧客からの問い合わせ対応に時間がかかっている。",
      plan: "FAQドキュメントを整備して、対応時間を短縮する。",
      status: ReportStatus.confirmed,
      visitRecords: {
        create: [
          {
            customerId: customer4.id,
            visitTime: new Date("1970-01-01T09:30:00"),
            visitPurpose: "クレーム対応",
            visitContent:
              "先週発生した納品遅延について謝罪と今後の対策を説明。",
            visitResult: "了承いただいた",
          },
          {
            customerId: customer5.id,
            visitTime: new Date("1970-01-01T15:00:00"),
            visitPurpose: "定期訪問",
            visitContent:
              "月次の定例ミーティング。来期の予算計画についてヒアリング。",
            visitResult: "予算増額の見込み",
          },
        ],
      },
    },
  });
  console.log(`Created confirmed report for ${member3.name}`);

  // 伊藤さんの日報に対するコメント
  await prisma.comment.create({
    data: {
      reportId: report3.id,
      salesPersonId: manager2.id,
      commentText:
        "クレーム対応、お疲れ様でした。FAQの整備は良いアイデアです。確認しました。",
    },
  });
  console.log("Created comment on confirmed report");

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
