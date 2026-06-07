import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/mongodb';
import { User } from '@/lib/models/User';
import { Dataset } from '@/lib/models/Dataset';
import { Row } from '@/lib/models/Row';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Only runs in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 });
  }

  try {
    await connectDB();

    const email = 'demo@datapulse.app';

    // 1. Create or get demo user
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash('demo1234', 12);
      user = await User.create({
        name: 'Demo User',
        email,
        passwordHash,
        role: 'admin',
      });
    }

    const userId = user.email; // Store email consistently as userId

    // Clear previous demo datasets for this user to avoid duplication
    const prevDatasets = await Dataset.find({ userId, name: { $in: ['Q3 Sales 2024', 'Website Analytics', 'Employee Performance'] } });
    const prevIds = prevDatasets.map(d => d._id);
    await Dataset.deleteMany({ _id: { $in: prevIds } });
    await Row.deleteMany({ datasetId: { $in: prevIds } });

    // --- SEED DATASET 1: Q3 Sales 2024 (48 rows) ---
    const headers1 = ['Month', 'Category', 'Revenue', 'Units', 'Growth', 'Margin'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const categories = ['Electronics', 'Food', 'Apparel', 'Books', 'Sports'];
    
    const rows1: any[] = [];
    for (let i = 0; i < 48; i++) {
      const month = months[i % months.length];
      const category = categories[Math.floor(Math.random() * categories.length)];
      const revenue = Math.floor(Math.random() * (15000 - 500 + 1)) + 500;
      const units = Math.floor(Math.random() * (500 - 10 + 1)) + 10;
      const growth = Math.floor(Math.random() * (60 - (-20) + 1)) - 20;
      const margin = Math.floor(Math.random() * (45 - 10 + 1)) + 10;
      rows1.push({ Month: month, Category: category, Revenue: revenue, Units: units, Growth: growth, Margin: margin });
    }

    const dataset1 = await Dataset.create({
      userId,
      name: 'Q3 Sales 2024',
      fileName: 'q3_sales_2024.csv',
      fileType: 'csv',
      source: 'csv',
      headers: headers1,
      rowCount: rows1.length,
      numericCols: ['Revenue', 'Units', 'Growth', 'Margin'],
      categoricalCols: ['Month', 'Category'],
      tags: ['demo', 'sales'],
    });

    await Row.insertMany(rows1.map((row, idx) => ({
      datasetId: dataset1._id,
      userId,
      data: row,
      rowIndex: idx,
    })));

    // --- SEED DATASET 2: Website Analytics (30 rows) ---
    const headers2 = ['Date', 'Page', 'Views', 'Sessions', 'Bounce Rate', 'Avg Duration'];
    const pages = ['/home', '/pricing', '/docs', '/blog', '/dashboard'];
    
    const rows2: any[] = [];
    for (let i = 1; i <= 30; i++) {
      const day = i < 10 ? `0${i}` : `${i}`;
      const date = `2024-09-${day}`;
      const page = pages[Math.floor(Math.random() * pages.length)];
      const views = Math.floor(Math.random() * (5000 - 100 + 1)) + 100;
      const sessions = Math.floor(views * (0.6 + Math.random() * 0.3)); // 60% to 90% of views
      const bounceRate = Math.floor(Math.random() * (80 - 20 + 1)) + 20;
      const avgDuration = Math.floor(Math.random() * (360 - 30 + 1)) + 30;
      rows2.push({ Date: date, Page: page, Views: views, Sessions: sessions, 'Bounce Rate': bounceRate, 'Avg Duration': avgDuration });
    }

    const dataset2 = await Dataset.create({
      userId,
      name: 'Website Analytics',
      fileName: 'website_analytics.xlsx',
      fileType: 'xlsx',
      source: 'xlsx',
      headers: headers2,
      rowCount: rows2.length,
      numericCols: ['Views', 'Sessions', 'Bounce Rate', 'Avg Duration'],
      categoricalCols: ['Date', 'Page'],
      tags: ['demo', 'web-traffic'],
    });

    await Row.insertMany(rows2.map((row, idx) => ({
      datasetId: dataset2._id,
      userId,
      data: row,
      rowIndex: idx,
    })));

    // --- SEED DATASET 3: Employee Performance (25 rows) ---
    const headers3 = ['Name', 'Department', 'Score', 'Projects', 'Tenure', 'Rating'];
    const departments = ['Engineering', 'Product', 'Design', 'Marketing', 'Sales'];
    const names = [
      'Alice Smith', 'Bob Jones', 'Charlie Brown', 'David Miller', 'Eva Davis', 
      'Frank Wilson', 'Grace Taylor', 'Henry Thomas', 'Ivy Martin', 'Jack Jackson', 
      'Karl Larson', 'Leo Vance', 'Mia Scott', 'Nora Clark', 'Oscar Perez', 
      'Paul Adams', 'Quincy Diaz', 'Rachel White', 'Sam Harris', 'Thomas Nelson', 
      'Ursula Green', 'Victor Baker', 'Wendy Carter', 'Xavier Evans', 'Yolanda Young'
    ];
    
    const rows3: any[] = [];
    for (let i = 0; i < 25; i++) {
      const name = names[i];
      const dept = departments[i % departments.length];
      const score = Math.floor(Math.random() * (100 - 50 + 1)) + 50;
      const projects = Math.floor(Math.random() * (10 - 1 + 1)) + 1;
      const tenure = Math.floor(Math.random() * (8 - 1 + 1)) + 1;
      
      let rating = 'Meets Expectations';
      if (score >= 90) rating = 'Outstanding';
      else if (score >= 80) rating = 'Exceeds Expectations';
      else if (score < 65) rating = 'Needs Improvement';

      rows3.push({ Name: name, Department: dept, Score: score, Projects: projects, Tenure: tenure, Rating: rating });
    }

    const dataset3 = await Dataset.create({
      userId,
      name: 'Employee Performance',
      fileName: 'employee_performance.xlsx',
      fileType: 'xlsx',
      source: 'xlsx',
      headers: headers3,
      rowCount: rows3.length,
      numericCols: ['Score', 'Projects', 'Tenure'],
      categoricalCols: ['Name', 'Department', 'Rating'],
      tags: ['demo', 'hr'],
    });

    await Row.insertMany(rows3.map((row, idx) => ({
      datasetId: dataset3._id,
      userId,
      data: row,
      rowIndex: idx,
    })));

    return NextResponse.json({
      success: true,
      message: 'Seeded 3 datasets for demo@datapulse.app',
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return NextResponse.json({ error: 'Failed to seed demo data' }, { status: 500 });
  }
}
