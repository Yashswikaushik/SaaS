import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
import * as React from 'react';
import { amountInWords } from './amount-in-words';
import { STATE_CODES } from './constants';

export interface InvoiceData {
  invoiceNo: string;
  issuedAt: Date;
  supplier: {
    name: string;
    gstin: string;
    address: string;
    stateCode: string;
    pan: string;
  };
  recipient: {
    name: string;
    legalName?: string;
    gstin: string | null;
    address: string;
    stateCode: string;
  };
  placeOfSupplyCode: string;
  hsnSac: string;
  description: string;
  taxableAmountPaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalPaise: number;
  razorpayPaymentId?: string;
}

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: 'Helvetica', color: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  brand: { fontSize: 18, fontWeight: 'bold', color: '#1e3a8a' },
  meta: { textAlign: 'right' },
  metaLine: { marginBottom: 2 },
  title: { fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: '#0f172a' },
  section: { marginBottom: 12 },
  twoCol: { flexDirection: 'row', gap: 16 },
  col: { flex: 1, padding: 8, backgroundColor: '#f8fafc', borderRadius: 4 },
  bold: { fontWeight: 'bold' },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    padding: 6,
    fontWeight: 'bold',
  },
  row: { flexDirection: 'row', padding: 6, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0' },
  cellDesc: { flex: 3 },
  cellHsn: { flex: 1, textAlign: 'center' },
  cellAmt: { flex: 1.2, textAlign: 'right' },
  totalRow: { flexDirection: 'row', padding: 6, fontWeight: 'bold' },
  footer: { marginTop: 24, fontSize: 8, color: '#64748b', textAlign: 'center' },
});

function paiseToInr(paise: number): string {
  const rupees = paise / 100;
  return rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function InvoicePdfDocument({ data }: { data: InvoiceData }): React.ReactElement {
  const stateName = STATE_CODES[data.placeOfSupplyCode as keyof typeof STATE_CODES] ?? data.placeOfSupplyCode;
  return (
    <Document title={`Invoice ${data.invoiceNo}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Bharat Leads</Text>
            <Text>GST Invoice</Text>
          </View>
          <View style={styles.meta}>
            <Text style={styles.metaLine}>
              <Text style={styles.bold}>Invoice #: </Text>
              {data.invoiceNo}
            </Text>
            <Text style={styles.metaLine}>
              <Text style={styles.bold}>Date: </Text>
              {data.issuedAt.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </Text>
            <Text style={styles.metaLine}>
              <Text style={styles.bold}>Place of supply: </Text>
              {data.placeOfSupplyCode} - {stateName}
            </Text>
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.col}>
            <Text style={styles.bold}>Supplier (Bill from)</Text>
            <Text>{data.supplier.name}</Text>
            <Text>{data.supplier.address}</Text>
            <Text>GSTIN: {data.supplier.gstin}</Text>
            <Text>PAN: {data.supplier.pan}</Text>
            <Text>State Code: {data.supplier.stateCode}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.bold}>Recipient (Bill to)</Text>
            <Text>{data.recipient.legalName ?? data.recipient.name}</Text>
            <Text>{data.recipient.address}</Text>
            <Text>GSTIN: {data.recipient.gstin ?? 'Unregistered'}</Text>
            <Text>State Code: {data.recipient.stateCode}</Text>
          </View>
        </View>

        <View style={{ marginTop: 16 }}>
          <View style={styles.tableHeader}>
            <Text style={styles.cellDesc}>Description</Text>
            <Text style={styles.cellHsn}>SAC</Text>
            <Text style={styles.cellAmt}>Taxable (₹)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.cellDesc}>{data.description}</Text>
            <Text style={styles.cellHsn}>{data.hsnSac}</Text>
            <Text style={styles.cellAmt}>{paiseToInr(data.taxableAmountPaise)}</Text>
          </View>
          {data.cgstPaise > 0 && (
            <View style={styles.row}>
              <Text style={styles.cellDesc}>CGST @ 9%</Text>
              <Text style={styles.cellHsn}>—</Text>
              <Text style={styles.cellAmt}>{paiseToInr(data.cgstPaise)}</Text>
            </View>
          )}
          {data.sgstPaise > 0 && (
            <View style={styles.row}>
              <Text style={styles.cellDesc}>SGST @ 9%</Text>
              <Text style={styles.cellHsn}>—</Text>
              <Text style={styles.cellAmt}>{paiseToInr(data.sgstPaise)}</Text>
            </View>
          )}
          {data.igstPaise > 0 && (
            <View style={styles.row}>
              <Text style={styles.cellDesc}>IGST @ 18%</Text>
              <Text style={styles.cellHsn}>—</Text>
              <Text style={styles.cellAmt}>{paiseToInr(data.igstPaise)}</Text>
            </View>
          )}
          <View style={[styles.totalRow, { backgroundColor: '#f1f5f9' }]}>
            <Text style={styles.cellDesc}>Total Payable</Text>
            <Text style={styles.cellHsn}>INR</Text>
            <Text style={styles.cellAmt}>{paiseToInr(data.totalPaise)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 12 }}>
          <Text style={styles.bold}>Total in words</Text>
          <Text>{amountInWords(data.totalPaise)}</Text>
        </View>

        {data.razorpayPaymentId && (
          <View style={{ marginTop: 8 }}>
            <Text>Razorpay Payment Reference: {data.razorpayPaymentId}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text>
            This is a computer-generated invoice and does not require a signature. Subject to Bengaluru
            jurisdiction. For grievances contact privacy@bharatleads.in.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Render PDF to a Node Buffer for storage upload. */
export async function renderInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const stream = await pdf(<InvoicePdfDocument data={data} />).toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of stream as unknown as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
