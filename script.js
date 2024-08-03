let currentStudentIndex = 0;
let students = [];
const subjects = JSON.parse(localStorage.getItem('subjects')) || [];
const totalMarks = parseFloat(localStorage.getItem('totalMarks')) || 0;
const passingMarks = parseFloat(localStorage.getItem('passingMarks')) || 0;

window.onload = function() {
    clearAllData(); // Clear data on page load
    if (students.length === 0) {
        students.push({}); // Initialize with one empty student object
    }
    loadStudent(currentStudentIndex);
    populateSubjects();
    updateStudentCounter();
};

function clearAllData() {
    localStorage.removeItem('students');
    students = [];
}

function populateSubjects() {
    const subjectsContainer = document.getElementById('subjectsContainer');
    subjectsContainer.innerHTML = '';

    subjects.forEach(subject => {
        const row = document.createElement('tr');

        const subjectCell = document.createElement('td');
        subjectCell.innerText = subject;
        row.appendChild(subjectCell);

        const marksCell = document.createElement('td');
        const marksInput = document.createElement('input');
        marksInput.type = 'number';
        marksInput.className = 'subjectMarks';
        marksInput.dataset.subject = subject;

        marksCell.appendChild(marksInput);
        row.appendChild(marksCell);

        const totalMarksCell = document.createElement('td');
        totalMarksCell.innerText = totalMarks;
        row.appendChild(totalMarksCell);

        const passingMarksCell = document.createElement('td');
        passingMarksCell.innerText = passingMarks;
        row.appendChild(passingMarksCell);

        subjectsContainer.appendChild(row);
    });
}

function saveCurrentStudent() {
    const studentName = document.getElementById('studentName').value;
    const fatherName = document.getElementById('fatherName').value;
    const rollNumber = document.getElementById('rollNumber').value;
    const marks = {};

    subjects.forEach(subject => {
        marks[subject] = parseFloat(document.querySelector(`.subjectMarks[data-subject="${subject}"]`).value) || 0;
    });

    const studentData = { studentName, fatherName, rollNumber, subjects, totalMarks, passingMarks, marks };
    students[currentStudentIndex] = studentData;
    localStorage.setItem('students', JSON.stringify(students));
    updateStudentCounter();
}

function nextStudent() {
    saveCurrentStudent();
    currentStudentIndex++;
    if (currentStudentIndex >= students.length) {
        students.push({}); // Add a new empty student object if necessary

        // Clear inputs for the new student
        document.getElementById('studentName').value = '';
        document.getElementById('fatherName').value = '';
        document.getElementById('rollNumber').value = '';

        subjects.forEach(subject => {
            const marksInput = document.querySelector(`.subjectMarks[data-subject="${subject}"]`);
            if (marksInput) {
                marksInput.value = ''; // Clear the input value
            }
        });
    } else {
        loadStudent(currentStudentIndex);
    }
    updateStudentCounter();
}


function previousStudent() {
    saveCurrentStudent();
    if (currentStudentIndex > 0) {
        currentStudentIndex--;
        loadStudent(currentStudentIndex);
        updateStudentCounter();
    }
}

function loadStudent(index) {
    const studentData = students[index] || {};
    document.getElementById('studentName').value = studentData.studentName || '';
    document.getElementById('fatherName').value = studentData.fatherName || '';
    document.getElementById('rollNumber').value = studentData.rollNumber || '';

    subjects.forEach(subject => {
        const marksInput = document.querySelector(`.subjectMarks[data-subject="${subject}"]`);
        if (marksInput) {
            marksInput.value = studentData.marks[subject] || '';
        }
    });
}

function updateStudentCounter() {
    const counter = document.getElementById('studentCounter');
    const totalStudents = students.length;
    counter.innerText = `Student ${currentStudentIndex + 1} of ${totalStudents}`;
}

function deleteStudent() {
    if (students.length > 0) {
        if (confirm('Are you sure you want to delete this student?')) {
            // Remove the current student
            students.splice(currentStudentIndex, 1);

            // Update local storage
            localStorage.setItem('students', JSON.stringify(students));

            // Adjust currentStudentIndex
            if (students.length === 0) {
                // If no students left, add an empty student
                students.push({});
                currentStudentIndex = 0;
            } else if (currentStudentIndex >= students.length) {
                // If currentStudentIndex is out of bounds, show the last student
                currentStudentIndex = students.length - 1;
            }

            // Save changes and update the UI
            saveCurrentStudent();
            loadStudent(currentStudentIndex);
            updateStudentCounter();
        }
    } else {
        alert('No students available to delete.');
    }
}

function generatePDF() {
    saveCurrentStudent(); // Save the current student data before generating PDF

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const fitText = (text, maxWidth, fontSize) => {
        let currentFontSize = fontSize;
        doc.setFontSize(currentFontSize);
        while (doc.getTextWidth(text) > maxWidth && currentFontSize > 1) {
            currentFontSize -= 0.5;
            doc.setFontSize(currentFontSize);
        }
        return currentFontSize;
    };

    // Calculate total marks for each student
    students.forEach(student => {
        student.totalMarksObtained = student.subjects.reduce((sum, subject) => {
            return sum + (student.marks[subject] || 0);
        }, 0);
    });

    // Determine positions based on total marks
    const studentMarks = students.map(student => student.totalMarksObtained);
    const sortedMarks = [...studentMarks].sort((a, b) => b - a);
    students.forEach(student => {
        student.position = sortedMarks.indexOf(student.totalMarksObtained) + 1;
    });

    students.forEach((studentData, index) => {
        if (index > 0) doc.addPage();

        const margin = 10;
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        const rowHeight = 8;
        const headerHeight = 10;
        let yPosition = margin;

        // Draw page border
        doc.setDrawColor(0);
        doc.setLineWidth(0.5);
        doc.rect(margin - 5, margin - 5, pageWidth - 2 * margin + 10, pageHeight - 2 * margin + 10);

        yPosition += 10;

        // School Name
        doc.setFontSize(18);
        doc.setFont('Algerian', 'bold');
        const schoolName = localStorage.getItem('schoolName');
        const schoolNameWidth = doc.getTextWidth(schoolName);
        const schoolNameX = (pageWidth - schoolNameWidth) / 2;
        doc.text(schoolName, schoolNameX, yPosition);
        yPosition += 15;

        // Student Info
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`Student Name: ${studentData.studentName}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Father Name: ${studentData.fatherName}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Roll Number: ${studentData.rollNumber}`, margin, yPosition);
        yPosition += 7;
        const className = localStorage.getItem('className');
        doc.text(`Class: ${className}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, yPosition);
        yPosition += 7;
        doc.text(`Position: ${studentData.position} ${studentData.position === 1 ? 'st' : studentData.position === 2 ? 'nd' : studentData.position === 3 ? 'rd' : 'th'}`, margin, yPosition);
        yPosition += 15;

        // Table Header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(200, 220, 255);
        doc.setTextColor(0);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, headerHeight, 'F');
        doc.text('Subject', margin + 2, yPosition + 5);
        doc.text('Marks', margin + 30, yPosition + 5);
        doc.text('Max', margin + 50, yPosition + 5);
        doc.text('Min', margin + 70, yPosition + 5);
        doc.text('Percent', margin + 90, yPosition + 5);
        doc.text('Grade', margin + 110, yPosition + 5);
        doc.text('Remarks', margin + 130, yPosition + 5);
        doc.text('Status', margin + 160, yPosition + 5);
        yPosition += headerHeight;

        // Table Content
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0);
        const tableWidth = pageWidth - 2 * margin;
        const columnWidths = {
            subject: 28,
            marks: 20,
            totalMarks: 20,
            passingMarks: 20,
            percent: 20,
            grade: 20,
            remarks: 30,
            status: 20
        };

        let totalMarks = 0;
        let totalObtainedMarks = 0;
        let allSubjectsPassed = true;

        studentData.subjects.forEach((subject, idx) => {
            const marks = studentData.marks[subject] || 0;
            const percentage = ((marks / studentData.totalMarks) * 100).toFixed(2);
            const grade = getGrade(parseFloat(percentage));
            const remarks = getRemarks(parseFloat(percentage));
            const status = marks >= studentData.passingMarks ? 'Passed' : 'Failed';
            
            if (status === 'Failed') {
                allSubjectsPassed = false;
            }

            const subjectFontSize = fitText(subject, columnWidths.subject, 10);
            const marksFontSize = fitText(marks.toString(), columnWidths.marks, 10);
            const totalMarksFontSize = fitText(studentData.totalMarks.toString(), columnWidths.totalMarks, 10);
            const passingMarksFontSize = fitText(studentData.passingMarks.toString(), columnWidths.passingMarks, 10);
            const percentFontSize = fitText(percentage, columnWidths.percent, 10);
            const gradeFontSize = fitText(grade, columnWidths.grade, 10);
            const remarksFontSize = fitText(remarks, columnWidths.remarks, 10);
            const statusFontSize = fitText(status, columnWidths.status, 10);

            if (yPosition + rowHeight > pageHeight - margin) {
                doc.addPage();
                yPosition = margin;
                doc.rect(margin - 5, margin - 5, pageWidth - 2 * margin + 10, pageHeight - 2 * margin + 10); // Redraw border
                yPosition += 15; // Adjust for the border and header
            }

            doc.setFillColor(255, 255, 255);
            doc.rect(margin, yPosition, tableWidth, rowHeight, 'F');

            doc.setFontSize(subjectFontSize);
            doc.text(subject, margin + 2, yPosition + 5);
            doc.setFontSize(marksFontSize);
            doc.text(marks.toString(), margin + 30, yPosition + 5);
            doc.setFontSize(totalMarksFontSize);
            doc.text(studentData.totalMarks.toString(), margin + 50, yPosition + 5);
            doc.setFontSize(passingMarksFontSize);
            doc.text(studentData.passingMarks.toString(), margin + 70, yPosition + 5);
            doc.setFontSize(percentFontSize);
            doc.text(percentage, margin + 90, yPosition + 5);
            doc.setFontSize(gradeFontSize);
            doc.text(grade, margin + 110, yPosition + 5);
            doc.setFontSize(remarksFontSize);
            doc.text(remarks, margin + 130, yPosition + 5);
            doc.setFontSize(statusFontSize);
            doc.text(status, margin + 160, yPosition + 5);

            totalMarks += studentData.totalMarks;
            totalObtainedMarks += marks;

            yPosition += rowHeight;
        });

        // Add a row for the student's total marks
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(200, 220, 255);
        const totalRowY = yPosition + 5;
        doc.rect(margin, totalRowY, tableWidth, rowHeight, 'F');
        doc.text('Total', margin + 2, totalRowY + 5);
        doc.text(totalObtainedMarks.toString(), margin + 30, totalRowY + 5);
        doc.text(totalMarks.toString(), margin + 50, totalRowY + 5);
        doc.text('-', margin + 70, totalRowY + 5); // Show '-' for Min. Marks
        const totalPercentage = ((totalObtainedMarks / (studentData.subjects.length * studentData.totalMarks)) * 100).toFixed(2);
        doc.text(totalPercentage, margin + 90, totalRowY + 5);
        doc.text(getGrade(parseFloat(totalPercentage)), margin + 110, totalRowY + 5);
        doc.text(getRemarks(parseFloat(totalPercentage)), margin + 130, totalRowY + 5);
        doc.text(allSubjectsPassed ? 'Passed' : 'Failed', margin + 160, totalRowY + 5); // Show Passed/Failed based on all subjects status

        yPosition += rowHeight;
    });

    doc.save('MarkSheets.pdf');
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    if (percentage >= 40) return 'E';
    return 'F';
}

function getRemarks(percentage) {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Fantastic';
    if (percentage >= 70) return 'Very Good';
    if (percentage >= 60) return 'Good';
    if (percentage >= 50) return 'Nice';
    if (percentage >= 40) return 'Satisfactory';
    return 'Poor';
}

function exportStudents() {
    const blob = new Blob([JSON.stringify(students, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.json';
    a.click();
    URL.revokeObjectURL(url);
}

function importStudents() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedData = JSON.parse(e.target.result);
                students = importedData;
                localStorage.setItem('students', JSON.stringify(students));
                currentStudentIndex = 0;
                loadStudent(currentStudentIndex);
                updateStudentCounter();
            } catch (error) {
                alert('Failed to import data: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
}

// Event Listeners
document.getElementById('nextButton').addEventListener('click', nextStudent);
document.getElementById('previousButton').addEventListener('click', previousStudent);
document.getElementById('generatePDFButton').addEventListener('click', generatePDF);
document.getElementById('deleteButton').addEventListener('click', deleteStudent);
