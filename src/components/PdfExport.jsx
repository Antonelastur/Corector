import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function PdfExport({ correctionData }) {
    const handleExport = () => {
        const doc = new jsPDF();
        const { studentName, className, date, score, maxScore, errors = [], exercises = [], ocrText } = correctionData;

        // Header
        doc.setFontSize(20);
        doc.setTextColor(26, 35, 126);
        doc.text('Raport de Corectare', 105, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(117, 117, 117);
        doc.text('Generat de Corector', 105, 28, { align: 'center' });

        // Line
        doc.setDrawColor(63, 81, 181);
        doc.setLineWidth(0.5);
        doc.line(20, 32, 190, 32);

        // Student Info
        let yPos = 42;
        doc.setFontSize(11);
        doc.setTextColor(33, 33, 33);
        doc.text(`Elev: ${studentName || 'N/A'}`, 20, yPos);
        doc.text(`Clasa: ${className || 'N/A'}`, 120, yPos);
        yPos += 8;
        doc.text(`Data: ${date || new Date().toLocaleDateString('ro-RO')}`, 20, yPos);
        if (score !== undefined && maxScore !== undefined) {
            const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
            doc.text(`Punctaj: ${score}/${maxScore} (${pct}%)`, 120, yPos);
        }

        yPos += 15;

        // OCR Text
        if (ocrText) {
            doc.setFontSize(13);
            doc.setTextColor(26, 35, 126);
            doc.text('Text extras (OCR)', 20, yPos);
            yPos += 8;
            doc.setFontSize(9);
            doc.setTextColor(66, 66, 66);
            const textLines = doc.splitTextToSize(ocrText, 170);
            doc.text(textLines, 20, yPos);
            yPos += textLines.length * 4.5 + 10;
        }

        // Errors Table
        if (errors.length > 0) {
            if (yPos > 250) { doc.addPage(); yPos = 20; }
            doc.setFontSize(13);
            doc.setTextColor(26, 35, 126);
            doc.text('Greseli identificate', 20, yPos);
            yPos += 5;

            doc.autoTable({
                startY: yPos,
                head: [['Tip', 'Text gresit', 'Text corect', 'Explicatie']],
                body: errors.map(e => [
                    e.tip || '',
                    e.textGresit || '',
                    e.textCorect || '',
                    e.explicatie || ''
                ]),
                styles: {
                    fontSize: 8,
                    cellPadding: 4,
                    font: 'helvetica'
                },
                headStyles: {
                    fillColor: [26, 35, 126],
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                margin: { left: 20, right: 20 }
            });

            yPos = doc.lastAutoTable.finalY + 15;
        }

        // Exercises
        if (exercises.length > 0) {
            if (yPos > 230) { doc.addPage(); yPos = 20; }
            doc.setFontSize(13);
            doc.setTextColor(26, 35, 126);
            doc.text('Exercitii remediale', 20, yPos);
            yPos += 10;

            exercises.forEach((ex, i) => {
                if (yPos > 260) { doc.addPage(); yPos = 20; }
                doc.setFontSize(10);
                doc.setTextColor(46, 125, 50);
                doc.text(`${i + 1}. ${ex.titlu || 'Exercitiu ' + (i + 1)}`, 20, yPos);
                yPos += 6;
                doc.setFontSize(9);
                doc.setTextColor(66, 66, 66);
                const lines = doc.splitTextToSize(ex.cerinta || '', 170);
                doc.text(lines, 24, yPos);
                yPos += lines.length * 4.5 + 8;
            });
        }

        // Footer
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(189, 189, 189);
            doc.text(
                `Corector - Pagina ${i} din ${pageCount}`,
                105, 290,
                { align: 'center' }
            );
        }

        const fileName = `raport_${(studentName || 'elev').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
    };

    return (
        <button className="btn btn-secondary" onClick={handleExport}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export PDF
        </button>
    );
}
