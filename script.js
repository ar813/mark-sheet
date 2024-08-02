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
    }
    loadStudent(currentStudentIndex);
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
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    students.forEach((studentData, index) => {
        if (index > 0) doc.addPage();

        const margin = 10;
        const pageWidth = doc.internal.pageSize.width;
        const rowHeight = 8;
        const headerHeight = 10;
        let yPosition = margin;

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
        yPosition += 15;

        // Table Header
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setFillColor(200, 220, 255);
        doc.setTextColor(0);
        doc.rect(margin, yPosition, pageWidth - 2 * margin, headerHeight, 'F');
        doc.text('Subject', margin + 2, yPosition + 5);
        doc.text('Marks', margin + 30, yPosition + 5);
        doc.text('Total', margin + 50, yPosition + 5);
        doc.text('Passing', margin + 70, yPosition + 5);
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
        const columnWidths = [28, 20, 20, 20, 20, 20, 30, 30];

        studentData.subjects.forEach((subject, idx) => {
            const marks = studentData.marks[subject] || 0;
            const percentage = ((marks / studentData.totalMarks) * 100).toFixed(2);
            const grade = getGrade(parseFloat(percentage));
            const remarks = getRemarks(parseFloat(percentage));
            const status = marks >= studentData.passingMarks ? 'Passed' : 'Failed';

            doc.setFillColor(255, 255, 255);
            doc.rect(margin, yPosition, tableWidth, rowHeight, 'F');

            doc.text(subject, margin + 2, yPosition + 5);
            doc.text(marks.toString(), margin + 30, yPosition + 5);
            doc.text(studentData.totalMarks.toString(), margin + 50, yPosition + 5);
            doc.text(studentData.passingMarks.toString(), margin + 70, yPosition + 5);
            doc.text(percentage, margin + 90, yPosition + 5);
            doc.text(grade, margin + 110, yPosition + 5);
            doc.text(remarks, margin + 130, yPosition + 5);
            doc.text(status, margin + 160, yPosition + 5);

            yPosition += rowHeight;
        });
    });

    doc.save('MarkSheets.pdf');
}

function getGrade(percentage) {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    return 'D';
}

function getRemarks(percentage) {
    if (percentage >= 90) return 'Excellent';
    if (percentage >= 80) return 'Very Good';
    if (percentage >= 70) return 'Good';
    if (percentage >= 60) return 'Satisfactory';
    if (percentage >= 50) return 'Needs Improvement';
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
