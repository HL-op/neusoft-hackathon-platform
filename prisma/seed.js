const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // 创建默认管理员账号
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        email: 'admin@neusoft.edu.cn',
        password: adminPassword,
        name: 'Admin User',
        role: 'ADMIN',
        studentId: 'ADMIN001'
      }
    });
    console.log('Created admin user:', admin.email);

    // 创建默认评委账号
    const judgePassword = await bcrypt.hash('judge123', 10);
    const judge = await prisma.user.create({
      data: {
        email: 'judge@neusoft.edu.cn',
        password: judgePassword,
        name: 'Judge User',
        role: 'JUDGE',
        studentId: 'JUDGE001'
      }
    });
    console.log('Created judge user:', judge.email);

    // 创建测试参与者账号
    const participantPassword = await bcrypt.hash('participant123', 10);
    const participant = await prisma.user.create({
      data: {
        email: 'participant@neusoft.edu.cn',
        password: participantPassword,
        name: 'Participant User',
        role: 'PARTICIPANT',
        studentId: 'STUDENT001'
      }
    });
    console.log('Created participant user:', participant.email);

    // 创建测试比赛
    const competition = await prisma.competition.create({
      data: {
        name: 'AI Hackathon 2026',
        description: '广东东软学院人工智能学院首届AI编程黑客马拉松',
        startTime: new Date('2026-04-25T09:00:00'),
        endTime: new Date('2026-04-26T18:00:00'),
        isActive: true
      }
    });
    console.log('Created competition:', competition.name);

    // 创建测试题目
    const problem = await prisma.problem.create({
      data: {
        title: '智能文本处理工具',
        description: '实现一个智能文本处理工具，支持文本分析、情感分析等功能',
        difficulty: 'MEDIUM',
        score: 100,
        timeLimit: 1000,
        memoryLimit: 256,
        competitionId: competition.id
      }
    });
    console.log('Created problem:', problem.title);

    // 创建测试用例
    await prisma.testCase.create({
      data: {
        input: 'Hello world',
        expectedOutput: 'Hello world',
        isSample: true,
        problemId: problem.id
      }
    });
    console.log('Created test case');

    // 创建测试团队
    const team = await prisma.team.create({
      data: {
        name: 'Alpha Team',
        competitionId: competition.id
      }
    });
    console.log('Created team:', team.name);

    // 添加团队成员
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: participant.id,
        role: 'LEADER'
      }
    });
    console.log('Added team member');

    console.log('Seed data created successfully!');
  } catch (error) {
    console.error('Error creating seed data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();