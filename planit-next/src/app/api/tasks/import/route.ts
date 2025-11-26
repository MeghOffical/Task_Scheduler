import { NextResponse } from 'next/server';
import { Task } from '@/models';
import { getAuthenticatedUserId } from '@/lib/auth-utils';
import dbConnect from '@/lib/db';

// Keep runtime consistent with other task routes
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseCSV(content: string) {
  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length <= 1) return [];

  // Assume first line is header: Title,Description,Due Date,Time (24h),Status,Priority
  const [, ...dataLines] = lines;

  return dataLines.map((line) => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const [rawTitle, rawDescription, rawDate, rawTime, rawStatus, rawPriority] = values;

    const title = rawTitle?.replace(/^"|"$/g, '') || '';
    const description = rawDescription?.replace(/^"|"$/g, '') || '';
    const dateStr = rawDate?.replace(/^"|"$/g, '') || '';
    const timeStr = rawTime?.replace(/^"|"$/g, '') || '';
    const status = (rawStatus?.replace(/^"|"$/g, '') || 'pending') as
      | 'pending'
      | 'in-progress'
      | 'completed';
    const priority = (rawPriority?.replace(/^"|"$/g, '') || 'medium') as
      | 'low'
      | 'medium'
      | 'high';

    let dueDate: Date | null = null;
    if (dateStr) {
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        dueDate = parsed;
      }
    }

    let startTime: string | null = null;
    let endTime: string | null = null;
    if (timeStr) {
      const parts = timeStr.split('-').map((p) => p.trim());
      if (parts.length === 2) {
        startTime = parts[0] || null;
        endTime = parts[1] || null;
      } else if (parts.length === 1) {
        startTime = parts[0] || null;
      }
    }

    return {
      title,
      description,
      dueDate,
      startTime,
      endTime,
      status,
      priority,
    };
  });
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ message: 'CSV file is required' }, { status: 400 });
    }

    const text = await (file as Blob).text();
    const rows = parseCSV(text);

    if (!rows.length) {
      return NextResponse.json({ message: 'No valid rows found in CSV' }, { status: 400 });
    }

    await dbConnect();

    let createdCount = 0;

    for (const row of rows) {
      if (!row.title) continue;

      await Task.create({
        userId,
        title: row.title,
        description: row.description || '',
        priority: row.priority,
        status: row.status,
        dueDate: row.dueDate,
        startTime: row.startTime,
        endTime: row.endTime,
      });

      createdCount++;
    }

    return NextResponse.json(
      { message: 'Tasks imported successfully', count: createdCount },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error importing tasks from CSV:', error);
    return NextResponse.json(
      { message: 'Error importing tasks from CSV' },
      { status: 500 }
    );
  }
}
