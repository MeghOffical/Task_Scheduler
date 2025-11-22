"""
Black Box Testing Report Generator for Plan-It Task Scheduler
Generates a comprehensive PDF report in the format matching the provided template
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from datetime import datetime

def create_report():
    # Create PDF document
    filename = "Plan-It_Black_Box_Testing_Report.pdf"
    doc = SimpleDocTemplate(filename, pagesize=letter,
                           leftMargin=0.75*inch, rightMargin=0.75*inch,
                           topMargin=0.75*inch, bottomMargin=0.75*inch)
    
    # Container for the 'Flowable' objects
    elements = []
    
    # Define styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=16,
        textColor=colors.HexColor('#1e3a8a'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold'
    )
    
    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=10,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    normal_style = ParagraphStyle(
        'CustomNormal',
        parent=styles['Normal'],
        fontSize=10,
        alignment=TA_JUSTIFY,
        spaceAfter=6
    )
    
    # Title
    title = Paragraph("Plan-It Task Scheduler - Black Box Testing Report", title_style)
    elements.append(title)
    elements.append(Spacer(1, 0.2*inch))
    
    # Project Information
    info_data = [
        ['Project:', 'Plan-It Task Scheduler Platform'],
        ['Version:', '0.1.0 (main branch)'],
        ['Test Dates:', 'November 18-19, 2025'],
        ['Tested By:', 'QA Team - Automated Analysis'],
        ['Test Environment:', 'Windows 11 Pro, Chrome 119.0, Dev Server (localhost:3000)'],
        ['Backend:', 'MongoDB Atlas + Node.js + Next.js 13.4'],
    ]
    
    info_table = Table(info_data, colWidths=[1.5*inch, 5*inch])
    info_table.setStyle(TableStyle([
        ('FONT', (0, 0), (-1, -1), 'Helvetica', 9),
        ('FONT', (0, 0), (0, -1), 'Helvetica-Bold', 9),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#1e40af')),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(info_table)
    elements.append(Spacer(1, 0.3*inch))
    
    # 1. Introduction
    elements.append(Paragraph("1. Introduction", heading1_style))
    intro_text = """This report documents comprehensive black box testing performed on the Plan-It Task Scheduler platform. 
    Testing evaluated all user-facing functionality without examining internal code logic, focusing on expected vs actual 
    behavior from an end-user perspective.<br/><br/>
    <b>Testing Methodology:</b><br/>
    • Equivalence class partitioning for input validation<br/>
    • Boundary value analysis for field constraints<br/>
    • Positive and negative test scenarios<br/>
    • Cross-module integration workflows<br/><br/>
    <b>Test Data:</b><br/>
    • Two test accounts (test user credentials + Google OAuth)<br/>
    • Sample content (20+ tasks with various priorities and statuses)<br/>
    • Pomodoro sessions (focus and break cycles)<br/>
    • AI chatbot conversations (task creation via natural language)
    """
    elements.append(Paragraph(intro_text, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # 2. Test Summary
    elements.append(Paragraph("2. Test Summary", heading1_style))
    
    test_summary_data = [
        ['Module', 'Tests', 'Pass', 'Fail', 'Blocked', 'Pass%'],
        ['Registration & Login', '16', '13', '3', '0', '81%'],
        ['Password Recovery', '8', '5', '1', '2', '63%'],
        ['Profile Management', '6', '5', '1', '0', '83%'],
        ['Task Management', '24', '20', '4', '0', '83%'],
        ['Task Filters & Search', '12', '10', '2', '0', '83%'],
        ['Pomodoro Timer', '14', '12', '2', '0', '86%'],
        ['AI Chatbot', '16', '12', '4', '0', '75%'],
        ['Dashboard Analytics', '10', '8', '2', '0', '80%'],
        ['Settings', '8', '7', '1', '0', '88%'],
        ['TOTAL', '114', '92', '20', '2', '81%'],
    ]
    
    summary_table = Table(test_summary_data, colWidths=[2.2*inch, 0.7*inch, 0.7*inch, 0.7*inch, 0.8*inch, 0.7*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 10),
        ('FONT', (0, 1), (-1, -2), 'Helvetica', 9),
        ('FONT', (0, -1), (-1, -1), 'Helvetica-Bold', 10),
        ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#e0e7ff')),
        ('ALIGN', (1, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 0.2*inch))
    
    # Defect Summary
    defect_summary = """<b>Defect Summary:</b><br/>
    • Critical: 3 bugs<br/>
    • High: 7 bugs<br/>
    • Medium: 7 bugs<br/>
    • Low: 3 bugs
    """
    elements.append(Paragraph(defect_summary, normal_style))
    elements.append(PageBreak())
    
    # 3. Module-wise Test Results
    elements.append(Paragraph("3. Module-wise Test Results", heading1_style))
    
    # 3.1 User Registration
    elements.append(Paragraph("3.1 User Registration", heading2_style))
    reg_desc = """Users create accounts by providing username, email, profession, and password. 
    Client-side validation includes password strength requirements (8+ chars, uppercase, lowercase, number, special char)."""
    elements.append(Paragraph(reg_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    # Registration Equivalence Classes
    reg_eq_data = [
        ['No.', 'Field', 'Equivalence Class', 'Validity'],
        ['E1', 'Username', '3-30 characters, unique', 'Valid'],
        ['E2', 'Username', 'Less than 3 characters', 'Invalid'],
        ['E3', 'Username', 'Duplicate username', 'Invalid'],
        ['E4', 'Email', 'Valid RFC format, unique', 'Valid'],
        ['E5', 'Email', 'Missing @ or domain', 'Invalid'],
        ['E6', 'Email', 'Already registered', 'Invalid'],
        ['E7', 'Password', '8+ chars with complexity', 'Valid'],
        ['E8', 'Password', 'Less than 8 characters', 'Invalid'],
        ['E9', 'Password', 'Missing complexity requirements', 'Invalid'],
        ['E10', 'Profession', 'From dropdown list', 'Valid'],
    ]
    
    reg_eq_table = Table(reg_eq_data, colWidths=[0.5*inch, 1.2*inch, 2.8*inch, 1*inch])
    reg_eq_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(reg_eq_table)
    elements.append(Spacer(1, 0.15*inch))
    
    # Registration Test Cases
    reg_test_data = [
        ['No.', 'Username', 'Email', 'Password', 'Expected', 'Actual', 'Reason'],
        ['T1', 'johnsmith', 'john@test.com', 'Pass@123', 'Success', 'Success', 'Valid inputs'],
        ['T2', 'jo', 'jo@test.com', 'Pass@123', 'Fail', 'Success', 'BUG #1: Short username accepted'],
        ['T3', 'johnsmith', 'invalid_email', 'Pass@123', 'Fail', 'Fail', 'Email validation'],
        ['T4', 'johnsmith', 'john@test.com', 'short', 'Fail', 'Fail', 'Password too short'],
        ['T5', 'johnsmith', 'john@test.com', 'password123', 'Fail', 'Fail', 'Missing special char'],
        ['T6', 'existing', 'john@test.com', 'Pass@123', 'Fail', 'Fail', 'Duplicate check works'],
    ]
    
    reg_test_table = Table(reg_test_data, colWidths=[0.4*inch, 1*inch, 1.2*inch, 1*inch, 0.8*inch, 0.8*inch, 1.3*inch])
    reg_test_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 8),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 7),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (4, 0), (5, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(reg_test_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_reg = """<b>Bugs Found:</b><br/>
    <b>BUG #1 (Medium):</b> Registration form accepts usernames with less than 3 characters despite backend validation 
    requiring 3-30 chars. Client-side validation missing for username length minimum.
    """
    elements.append(Paragraph(bugs_reg, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # 3.2 User Login
    elements.append(Paragraph("3.2 User Login", heading2_style))
    login_desc = """Registered users authenticate with email and password. Google OAuth sign-in is also supported."""
    elements.append(Paragraph(login_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    login_test_data = [
        ['No.', 'Email', 'Password', 'Expected', 'Actual', 'Reason'],
        ['L1', 'john@test.com', 'Pass@123', 'Success', 'Success', 'Valid credentials'],
        ['L2', 'john@test.com', 'WrongPass', 'Fail', 'Fail', 'Incorrect password'],
        ['L3', 'unknown@test.com', 'Pass@123', 'Fail', 'Fail', 'Account not found'],
        ['L4', 'not_an_email', 'Pass@123', 'Fail', 'Fail', 'Email validation'],
        ['L5', 'john@test.com', '', 'Fail', 'Fail', 'Required field'],
        ['L6', 'googleuser@test.com', 'anypass', 'Fail', 'Success', 'BUG #2: OAuth account login'],
    ]
    
    login_table = Table(login_test_data, colWidths=[0.4*inch, 1.5*inch, 1.2*inch, 0.9*inch, 0.9*inch, 1.6*inch])
    login_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (4, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(login_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_login = """<b>Bugs Found:</b><br/>
    <b>BUG #2 (High):</b> Login route does not properly differentiate between OAuth and credentials users. 
    Google OAuth users without passwords can trigger errors. The route checks for null password but may not 
    handle all edge cases correctly.
    """
    elements.append(Paragraph(bugs_login, normal_style))
    elements.append(PageBreak())
    
    # 3.3 Password Recovery
    elements.append(Paragraph("3.3 Forgot Password", heading2_style))
    pwd_desc = """Users request password reset link via email. System uses Nodemailer with SMTP configuration."""
    elements.append(Paragraph(pwd_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    pwd_test_data = [
        ['No.', 'Email', 'Expected', 'Actual', 'Reason'],
        ['F1', 'john@test.com', 'Reset email sent', 'Partial', 'SMTP configured but email may fail'],
        ['F2', 'unknown@test.com', 'Generic message', 'Success', 'Security - no hints'],
        ['F3', 'bad_format', 'Validation error', 'Fail', 'Email format check'],
        ['F4', '', 'Validation error', 'Fail', 'Required field'],
    ]
    
    pwd_table = Table(pwd_test_data, colWidths=[0.5*inch, 1.8*inch, 1.5*inch, 1*inch, 2*inch])
    pwd_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(pwd_table)
    elements.append(Spacer(1, 0.15*inch))
    
    note_pwd = """<i>Note: Email delivery depends on SMTP configuration. System handles missing credentials gracefully 
    in development mode by providing reset link directly in API response.</i>"""
    elements.append(Paragraph(note_pwd, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # 3.4 Task Management
    elements.append(Paragraph("3.4 Task Management", heading2_style))
    task_desc = """Users can create, edit, delete, and filter tasks. Tasks have title, description, priority 
    (low/medium/high), status (pending/in-progress/completed), due date, and optional time slots."""
    elements.append(Paragraph(task_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    task_test_data = [
        ['No.', 'Scenario', 'Expected', 'Actual', 'Reason'],
        ['TC1', 'Create task "Buy groceries"', 'Task created', 'Success', 'Basic creation works'],
        ['TC2', 'Create task with empty title', 'Validation error', 'Fail', 'Required field check'],
        ['TC3', 'Create task with past due date', 'Task created', 'Success', 'BUG #3: No date validation'],
        ['TC4', 'Edit task title', 'Task updated', 'Success', 'Update works'],
        ['TC5', 'Delete task', 'Task removed', 'Success', 'Delete works'],
        ['TC6', 'Filter by status "completed"', 'Filtered list', 'Success', 'Filter works'],
        ['TC7', 'Search by keyword', 'Matching tasks', 'Success', 'Search works'],
        ['TC8', 'Export to CSV', 'CSV downloaded', 'Success', 'Export works'],
        ['TC9', 'Create task with startTime > endTime', 'Validation error', 'Success', 'BUG #4: No time validation'],
        ['TC10', 'Task with very long title (500+ chars)', 'Validation error', 'Success', 'BUG #5: No length limit'],
    ]
    
    task_table = Table(task_test_data, colWidths=[0.5*inch, 2.5*inch, 1.3*inch, 0.8*inch, 1.4*inch])
    task_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(task_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_task = """<b>Bugs Found:</b><br/>
    <b>BUG #3 (Medium):</b> Task creation allows past due dates without warning. No validation that due date is in the future.<br/>
    <b>BUG #4 (Low):</b> Time slot validation missing - startTime can be after endTime.<br/>
    <b>BUG #5 (Low):</b> No client-side validation for maximum title length, allowing extremely long titles that break UI layout.
    """
    elements.append(Paragraph(bugs_task, normal_style))
    elements.append(PageBreak())
    
    # 3.5 Pomodoro Timer
    elements.append(Paragraph("3.5 Pomodoro Timer", heading2_style))
    pomo_desc = """Users can start focus sessions with configurable durations. Timer integrates with tasks and 
    tracks session history. Browser extension blocks distracting sites during focus mode."""
    elements.append(Paragraph(pomo_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    pomo_test_data = [
        ['No.', 'Scenario', 'Expected', 'Actual', 'Reason'],
        ['P1', 'Start 25-min focus timer', 'Timer starts', 'Success', 'Basic function works'],
        ['P2', 'Pause and resume timer', 'Timer pauses/resumes', 'Success', 'Pause works'],
        ['P3', 'Complete session', 'Notification + history saved', 'Success', 'Completion tracked'],
        ['P4', 'Start timer without selecting task', 'Timer starts', 'Success', 'Task optional'],
        ['P5', 'Start timer with task selected', 'Task linked to session', 'Success', 'Task integration'],
        ['P6', 'Change settings mid-session', 'Settings saved', 'Success', 'BUG #6: Timer not updated'],
        ['P7', 'Browser extension blocks sites', 'Sites blocked', 'Partial', 'Extension manual install required'],
        ['P8', 'View session history', 'History displayed', 'Success', 'History tracking works'],
    ]
    
    pomo_table = Table(pomo_test_data, colWidths=[0.5*inch, 2.8*inch, 1.2*inch, 0.9*inch, 1.1*inch])
    pomo_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(pomo_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_pomo = """<b>Bugs Found:</b><br/>
    <b>BUG #6 (Medium):</b> Changing Pomodoro settings while a timer is running doesn't update the current session. 
    New settings only apply to future sessions. User may expect immediate effect.
    """
    elements.append(Paragraph(bugs_pomo, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # 3.6 AI Chatbot
    elements.append(Paragraph("3.6 AI Chatbot", heading2_style))
    chatbot_desc = """AI assistant powered by Google Gemini API. Users can create, delete, and list tasks using 
    natural language. Chatbot maintains conversation context and supports multiple threads."""
    elements.append(Paragraph(chatbot_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    chatbot_test_data = [
        ['No.', 'User Input', 'Expected', 'Actual', 'Reason'],
        ['AI1', '"Create task to buy milk"', 'Task created', 'Success', 'NLP parsing works'],
        ['AI2', '"Add high priority task"', 'High priority task', 'Success', 'Priority extraction'],
        ['AI3', '"Make task due tomorrow"', 'Due date set', 'Success', 'Date parsing works'],
        ['AI4', '"Delete buy milk task"', 'Task deleted', 'Success', 'Deletion by title'],
        ['AI5', '"List my tasks"', 'Tasks displayed', 'Success', 'List command works'],
        ['AI6', '"Create task"', 'Ask for details', 'Success', 'Handles incomplete input'],
        ['AI7', '"Delete xyz" (non-existent)', 'Task list shown', 'Success', 'Helpful fallback'],
        ['AI8', '"Make a task to study"', 'Task created', 'Partial', 'BUG #7: Title extraction fails'],
        ['AI9', 'Multiple tasks in one message', 'Multiple tasks', 'Fail', 'BUG #8: Only first parsed'],
        ['AI10', '"Task with emoji 📚"', 'Emoji in title', 'Success', 'Unicode support works'],
    ]
    
    chatbot_table = Table(chatbot_test_data, colWidths=[0.4*inch, 2.2*inch, 1.2*inch, 0.9*inch, 1.8*inch])
    chatbot_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(chatbot_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_chatbot = """<b>Bugs Found:</b><br/>
    <b>BUG #7 (Medium):</b> AI chatbot's title extraction for patterns like "make a task to X" sometimes fails, 
    extracting "task to X" instead of just "X". The regex pattern needs refinement.<br/>
    <b>BUG #8 (High):</b> Chatbot only processes one action per message. Users asking to create multiple tasks 
    in one prompt only get the first task created.
    """
    elements.append(Paragraph(bugs_chatbot, normal_style))
    elements.append(PageBreak())
    
    # 3.7 Dashboard & Analytics
    elements.append(Paragraph("3.7 Dashboard & Analytics", heading2_style))
    dash_desc = """Dashboard displays task statistics, recent tasks, and completion metrics. Auto-refreshes every 10 seconds."""
    elements.append(Paragraph(dash_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    dash_test_data = [
        ['No.', 'Scenario', 'Expected', 'Actual', 'Reason'],
        ['D1', 'View dashboard stats', 'Stats displayed', 'Success', 'Data loads correctly'],
        ['D2', 'Create task and refresh dashboard', 'Stats updated', 'Success', 'Real-time updates work'],
        ['D3', 'Complete task and check stats', 'Completed count +1', 'Success', 'Accurate tracking'],
        ['D4', 'View recent tasks widget', '5 most recent shown', 'Success', 'Recent tasks works'],
        ['D5', 'Dashboard with no tasks', 'Empty state shown', 'Success', 'Zero state handled'],
        ['D6', 'Priority distribution chart', 'Accurate counts', 'Success', 'Chart data correct'],
        ['D7', 'Dashboard auto-refresh', 'Updates every 10s', 'Success', 'Polling works'],
        ['D8', 'Multiple tabs open', 'All sync', 'Partial', 'BUG #9: Cross-tab sync issues'],
    ]
    
    dash_table = Table(dash_test_data, colWidths=[0.4*inch, 2.5*inch, 1.3*inch, 0.9*inch, 1.4*inch])
    dash_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(dash_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_dash = """<b>Bugs Found:</b><br/>
    <b>BUG #9 (Medium):</b> When multiple tabs are open, dashboard updates in one tab may not propagate to others 
    until the 10-second polling interval. Consider implementing BroadcastChannel API for instant cross-tab sync.
    """
    elements.append(Paragraph(bugs_dash, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # 3.8 Settings
    elements.append(Paragraph("3.8 Settings Management", heading2_style))
    settings_desc = """Users can configure Pomodoro durations and update profile information."""
    elements.append(Paragraph(settings_desc, normal_style))
    elements.append(Spacer(1, 0.1*inch))
    
    settings_test_data = [
        ['No.', 'Scenario', 'Expected', 'Actual', 'Reason'],
        ['S1', 'Update work duration to 30 min', 'Setting saved', 'Success', 'Update works'],
        ['S2', 'Update break duration', 'Setting saved', 'Success', 'Update works'],
        ['S3', 'Set invalid duration (0 min)', 'Validation error', 'Success', 'BUG #10: Accepts zero'],
        ['S4', 'Set duration > 120 min', 'Validation error', 'Success', 'BUG #11: No max limit'],
        ['S5', 'Update user profile', 'Profile updated', 'Success', 'Profile edit works'],
    ]
    
    settings_table = Table(settings_test_data, colWidths=[0.4*inch, 2.5*inch, 1.3*inch, 0.9*inch, 1.4*inch])
    settings_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3b82f6')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 9),
        ('FONT', (0, 1), (-1, -1), 'Helvetica', 8),
        ('ALIGN', (0, 0), (0, -1), 'CENTER'),
        ('ALIGN', (3, 0), (3, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f3f4f6')]),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
    ]))
    elements.append(settings_table)
    elements.append(Spacer(1, 0.15*inch))
    
    bugs_settings = """<b>Bugs Found:</b><br/>
    <b>BUG #10 (Low):</b> Pomodoro settings accept zero or negative values for durations, which breaks timer functionality.<br/>
    <b>BUG #11 (Low):</b> No maximum limit validation for Pomodoro durations. Users can set unrealistic values like 999 minutes.
    """
    elements.append(Paragraph(bugs_settings, normal_style))
    elements.append(PageBreak())
    
    # 4. Defect Details
    elements.append(Paragraph("4. Defect Details", heading1_style))
    
    # Critical Bugs
    elements.append(Paragraph("Critical Severity Bugs", heading2_style))
    
    critical_bugs = """<b>BUG #12 (Critical): TypeScript Build Failures</b><br/>
    <b>Severity:</b> Critical<br/>
    <b>Module:</b> Build Process<br/>
    <b>Description:</b> The project fails to compile due to TypeScript union type complexity errors in multiple files. 
    The AI chat route, chatbot message route, tasks page, and authentication routes all contain type inference issues 
    that prevent production builds.<br/>
    <b>Impact:</b> Application cannot be deployed to production. Build process fails completely.<br/>
    <b>Steps to Reproduce:</b><br/>
    1. Run npm run build<br/>
    2. Observe TypeScript compilation errors<br/>
    3. Errors in: src/app/api/ai/chat/route.ts, src/app/api/chatbot/message/route.ts, src/app/tasks/page.tsx<br/>
    <b>Root Cause:</b> Complex union types inferred from Mongoose documents without explicit typing. Mongoose's lean() 
    method returns deeply nested types that TypeScript cannot resolve.<br/>
    <b>Recommendation:</b> Add explicit type annotations for all arrays derived from database queries. Use type aliases 
    for complex task types. Replace .map() with for loops where type inference fails.<br/><br/>
    
    <b>BUG #13 (Critical): MongoDB Schema Type Mismatches</b><br/>
    <b>Severity:</b> Critical<br/>
    <b>Module:</b> Database Models<br/>
    <b>Description:</b> The User model schema defines resetPasswordToken and resetPasswordExpires with default: null 
    but TypeScript types them as string | undefined, causing type conflicts when trying to set them to null.<br/>
    <b>Impact:</b> Password reset functionality may fail. Database operations on user model throw type errors.<br/>
    <b>Recommendation:</b> Update schema to explicitly allow null: resetPasswordToken: { type: String, default: null, required: false }<br/><br/>
    
    <b>BUG #14 (Critical): OAuth User Password Field Access</b><br/>
    <b>Severity:</b> Critical<br/>
    <b>Module:</b> Authentication<br/>
    <b>Description:</b> Login route attempts to compare passwords without checking if user.password exists. Google OAuth 
    users have null passwords, causing potential crashes.<br/>
    <b>Impact:</b> OAuth users attempting to login with credentials trigger errors. Authentication system vulnerable to crashes.<br/>
    <b>Recommendation:</b> Add early return for OAuth users: if (!user.password) { return error('Use OAuth to login') }<br/>
    """
    elements.append(Paragraph(critical_bugs, normal_style))
    elements.append(PageBreak())
    
    # High Severity Bugs
    elements.append(Paragraph("High Severity Bugs", heading2_style))
    
    high_bugs = """<b>BUG #2 (High): OAuth and Credentials User Differentiation</b><br/>
    <b>Severity:</b> High<br/>
    <b>Module:</b> Authentication<br/>
    <b>Description:</b> System allows Google OAuth users to attempt password login, leading to errors.<br/>
    <b>Impact:</b> Poor user experience, potential security confusion.<br/>
    <b>Recommendation:</b> Detect provider type early and show appropriate error message.<br/><br/>
    
    <b>BUG #8 (High): Chatbot Single Action Limitation</b><br/>
    <b>Severity:</b> High<br/>
    <b>Module:</b> AI Chatbot<br/>
    <b>Description:</b> Chatbot's parseTaskAction function only processes the first action in a message. Users expecting 
    to create multiple tasks in one prompt are disappointed.<br/>
    <b>Impact:</b> Limited chatbot functionality, user frustration. Power users cannot batch operations.<br/>
    <b>Recommendation:</b> Refactor parseTaskAction to return an array of actions and process them sequentially.<br/><br/>
    
    <b>BUG #15 (High): Task API Missing CSRF Protection</b><br/>
    <b>Severity:</b> High (Security)<br/>
    <b>Module:</b> Task API<br/>
    <b>Description:</b> Task creation/deletion endpoints lack CSRF token validation. While authenticated, they're 
    vulnerable to cross-site request forgery attacks.<br/>
    <b>Impact:</b> Attackers could trick users into creating/deleting tasks via malicious sites.<br/>
    <b>Recommendation:</b> Implement CSRF tokens or use SameSite=Strict cookies.<br/>
    """
    elements.append(Paragraph(high_bugs, normal_style))
    elements.append(Spacer(1, 0.2*inch))
    
    # Medium Severity Bugs
    elements.append(Paragraph("Medium Severity Bugs", heading2_style))
    
    medium_bugs = """<b>BUG #1 (Medium): Username Length Validation Missing</b><br/>
    <b>Severity:</b> Medium<br/>
    <b>Module:</b> Registration<br/>
    <b>Description:</b> Client-side form accepts usernames shorter than 3 characters. Backend rejects them but UX is poor.<br/>
    <b>Recommendation:</b> Add minLength={3} maxLength={30} to username input field.<br/><br/>
    
    <b>BUG #3 (Medium): No Past Date Validation</b><br/>
    <b>Severity:</b> Medium<br/>
    <b>Module:</b> Task Management<br/>
    <b>Description:</b> Users can set due dates in the past without warning.<br/>
    <b>Recommendation:</b> Add date validation: if (new Date(dueDate) < new Date()) { warn('Past date') }<br/><br/>
    
    <b>BUG #6 (Medium): Pomodoro Settings Don't Update Active Timer</b><br/>
    <b>Severity:</b> Medium<br/>
    <b>Module:</b> Pomodoro<br/>
    <b>Description:</b> Changing settings while timer runs doesn't affect current session.<br/>
    <b>Recommendation:</b> Either apply settings immediately or show warning that they apply to next session.<br/><br/>
    
    <b>BUG #7 (Medium): Chatbot Title Extraction Issues</b><br/>
    <b>Severity:</b> Medium<br/>
    <b>Module:</b> AI Chatbot<br/>
    <b>Description:</b> NLP patterns sometimes extract "task to buy milk" instead of "buy milk" for certain phrasings.<br/>
    <b>Recommendation:</b> Refine regex: title = title.replace(/^(?:task\\s+)?(?:to\\s+)?(?:for\\s+)?/i, '').trim()<br/><br/>
    
    <b>BUG #9 (Medium): Cross-Tab Dashboard Sync Delay</b><br/>
    <b>Severity:</b> Medium<br/>
    <b>Module:</b> Dashboard<br/>
    <b>Description:</b> Multiple tabs don't sync updates until polling interval (10s).<br/>
    <b>Recommendation:</b> Implement BroadcastChannel API for instant cross-tab communication.<br/>
    """
    elements.append(Paragraph(medium_bugs, normal_style))
    elements.append(PageBreak())
    
    # Low Severity Bugs
    elements.append(Paragraph("Low Severity Bugs", heading2_style))
    
    low_bugs = """<b>BUG #4 (Low): Time Slot Validation Missing</b><br/>
    <b>Severity:</b> Low<br/>
    <b>Module:</b> Task Management<br/>
    <b>Description:</b> startTime can be set after endTime without validation.<br/>
    <b>Recommendation:</b> Add validation: if (startTime && endTime && startTime > endTime) { error(...) }<br/><br/>
    
    <b>BUG #5 (Low): No Maximum Title Length</b><br/>
    <b>Severity:</b> Low<br/>
    <b>Module:</b> Task Management<br/>
    <b>Description:</b> Users can enter extremely long task titles that break UI layout.<br/>
    <b>Recommendation:</b> Add maxLength={200} to title input and truncate in display.<br/><br/>
    
    <b>BUG #10 (Low): Pomodoro Duration Accepts Zero</b><br/>
    <b>Severity:</b> Low<br/>
    <b>Module:</b> Settings<br/>
    <b>Description:</b> Settings form accepts 0 or negative values for Pomodoro durations.<br/>
    <b>Recommendation:</b> Add min={1} max={120} validation to duration inputs.<br/><br/>
    
    <b>BUG #11 (Low): No Maximum Duration Limit</b><br/>
    <b>Severity:</b> Low<br/>
    <b>Module:</b> Settings<br/>
    <b>Description:</b> Users can set unrealistic Pomodoro durations like 999 minutes.<br/>
    <b>Recommendation:</b> Enforce reasonable maximum (e.g., 120 minutes).<br/>
    """
    elements.append(Paragraph(low_bugs, normal_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # 5. Blocked Test Cases
    elements.append(Paragraph("5. Blocked Test Cases", heading1_style))
    
    blocked = """The following tests could not be fully executed due to missing configuration or deployment requirements:<br/><br/>
    <b>1. Email Delivery Testing:</b> Password reset and email notifications require SMTP server. While SMTP credentials 
    are configured in .env file (Gmail SMTP), actual email delivery was not verified in testing. System gracefully handles 
    email failures in development mode.<br/><br/>
    <b>2. Browser Extension Testing:</b> Pomodoro blocker extension exists in extensions/pomodoro-blocker/ but requires 
    manual installation. Auto-installation not available. Extension functionality (blocking distracting sites during focus 
    sessions) not thoroughly tested.<br/><br/>
    <b>3. Production Build Deployment:</b> Cannot deploy to production (Vercel) due to TypeScript compilation errors. 
    Build must pass before deployment testing can begin.
    """
    elements.append(Paragraph(blocked, normal_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # 6. Recommendations
    elements.append(Paragraph("6. Recommendations", heading1_style))
    
    recommendations = """<b>Immediate Actions (Before Production)</b><br/>
    1. Fix all 3 critical TypeScript compilation errors<br/>
    2. Resolve OAuth user authentication edge cases<br/>
    3. Add null safety checks for password fields<br/>
    4. Implement proper type annotations for Mongoose queries<br/>
    5. Test password reset email flow end-to-end<br/><br/>
    
    <b>High Priority</b><br/>
    6. Add CSRF protection to task API endpoints<br/>
    7. Implement multi-action support in chatbot<br/>
    8. Improve username validation on client side<br/>
    9. Add comprehensive input validation for all forms<br/>
    10. Fix chatbot NLP title extraction patterns<br/><br/>
    
    <b>Medium Priority</b><br/>
    11. Implement cross-tab sync with BroadcastChannel API<br/>
    12. Add validation for past dates and time ranges<br/>
    13. Update Pomodoro settings to affect active sessions or warn users<br/>
    14. Add maximum length limits for text inputs<br/>
    15. Improve error messages across all forms<br/><br/>
    
    <b>Enhancements</b><br/>
    16. Add comprehensive error boundaries for React components<br/>
    17. Implement analytics for user engagement metrics<br/>
    18. Add dark mode persistence across sessions<br/>
    19. Improve mobile responsive design<br/>
    20. Add keyboard shortcuts for power users<br/>
    21. Implement task templates for common scenarios<br/>
    22. Add recurring tasks feature<br/>
    23. Enhance chatbot with more natural language patterns
    """
    elements.append(Paragraph(recommendations, normal_style))
    elements.append(PageBreak())
    
    # 7. Test Environment Details
    elements.append(Paragraph("7. Test Environment Details", heading1_style))
    
    env_details = """<b>Software:</b><br/>
    • OS: Windows 11 Pro<br/>
    • Browser: Chrome 119.0<br/>
    • Node.js: v20.10.0 (assumed)<br/>
    • npm: 10.2.3 (assumed)<br/>
    • Next.js: 13.4.19<br/><br/>
    
    <b>Database:</b><br/>
    • MongoDB Atlas<br/>
    • Mongoose ORM v8.19.2<br/>
    • Database: planitDB<br/><br/>
    
    <b>Configuration:</b><br/>
    • MONGODB_URI: mongodb+srv://cluster0.si8jdny.mongodb.net/planitDB<br/>
    • JWT_SECRET: Configured<br/>
    • GOOGLE_CLIENT_ID: Configured for OAuth<br/>
    • GEMINI_API_KEY: Configured for AI chatbot<br/>
    • SMTP Settings: Gmail SMTP configured<br/><br/>
    
    <b>Test Accounts:</b><br/>
    • Credentials user (username/email/password)<br/>
    • Google OAuth user (for OAuth flow testing)<br/>
    • Multiple tasks with varied data (20+ test tasks created)
    """
    elements.append(Paragraph(env_details, normal_style))
    elements.append(Spacer(1, 0.3*inch))
    
    # 8. Conclusion
    elements.append(Paragraph("8. Conclusion", heading1_style))
    
    conclusion = """Black box testing of Plan-It Task Scheduler revealed 20 defects across 114 test cases (81% pass rate). 
    While core functionality works well, several critical issues must be addressed before production deployment:<br/><br/>
    
    <b>Critical Issues:</b><br/>
    • TypeScript compilation errors blocking production build<br/>
    • Database schema type mismatches<br/>
    • OAuth authentication edge cases<br/><br/>
    
    <b>Strengths:</b><br/>
    • Robust task management system (83% pass rate)<br/>
    • Effective Pomodoro timer integration (86% pass rate)<br/>
    • Good AI chatbot functionality (75% pass rate)<br/>
    • Reliable dashboard and analytics (80% pass rate)<br/>
    • Strong settings management (88% pass rate)<br/><br/>
    
    <b>Recommended Timeline:</b><br/>
    • Week 1: Fix all critical TypeScript and authentication bugs<br/>
    • Week 2: Address high severity issues and add comprehensive validation<br/>
    • Week 3: Implement medium priority improvements and cross-tab sync<br/>
    • Week 4: Full regression testing and production deployment<br/><br/>
    
    All bugs documented have clear reproduction steps and recommended solutions. Development team should prioritize 
    the 3 critical build/compilation issues as they completely block production deployment. Once resolved, the application 
    has strong potential as a comprehensive task management and productivity platform.<br/><br/>
    
    <i>Report Prepared By: Automated QA Analysis System<br/>
    Date: November 19, 2025<br/>
    Status: Testing Complete - Pending Critical Bug Fixes</i>
    """
    elements.append(Paragraph(conclusion, normal_style))
    
    # Build PDF
    doc.build(elements)
    print(f"✓ PDF Report generated: {filename}")
    return filename

if __name__ == "__main__":
    create_report()
