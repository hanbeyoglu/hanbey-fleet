export interface ParsedImportContent {
  shiftId?: string;
  declaredRevenue?: number;
  declaredHgs?: number;
  declaredTotal?: number;
  notes?: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedImportContent;
  error?: string;
}

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i;

const REVENUE_PATTERN =
  /(?:gelir|revenue|ciro|hasılat|hasilat)\s*:?\s*([\d\s.,]+)(?:\s*(?:tl|try|₺))?/i;

const HGS_PATTERN = /(?:hgs|geçiş|gecis)\s*:?\s*([\d\s.,]+)(?:\s*(?:tl|try|₺))?/i;

const TOTAL_PATTERN =
  /(?:toplam|total|net)\s*:?\s*([\d\s.,]+)(?:\s*(?:tl|try|₺))?/i;

const SHIFT_PATTERN =
  /(?:shift|vardiya|vardiyaId|shiftId)\s*:?\s*([0-9a-f-]{36})/i;

const NOTES_PATTERN = /(?:not|notes|açıklama|aciklama|note)\s*:?\s*(.+)/i;

export class ParserService {
  parse(rawContent: string): ParseResult {
    const normalized = rawContent.trim();
    if (!normalized) {
      return { success: false, error: 'Raw content is empty' };
    }

    const shiftId = this.extractShiftId(normalized);
    const declaredRevenue = this.extractAmount(normalized, REVENUE_PATTERN);
    const declaredHgs = this.extractAmount(normalized, HGS_PATTERN);
    const explicitTotal = this.extractAmount(normalized, TOTAL_PATTERN);
    const notes = this.extractNotes(normalized);

    const missing: string[] = [];
    if (!shiftId) missing.push('shift');
    if (declaredRevenue === undefined) missing.push('revenue');
    if (declaredHgs === undefined) missing.push('HGS');

    if (missing.length > 0) {
      return {
        success: false,
        error: `Required fields could not be extracted: ${missing.join(', ')}`,
        data: {
          shiftId,
          declaredRevenue,
          declaredHgs,
          declaredTotal: explicitTotal,
          notes,
        },
      };
    }

    const declaredTotal =
      explicitTotal ?? this.roundCurrency(declaredRevenue! + declaredHgs!);

    return {
      success: true,
      data: {
        shiftId,
        declaredRevenue,
        declaredHgs,
        declaredTotal,
        notes,
      },
    };
  }

  normalizeCurrency(value: string): number {
    const trimmed = value.trim().replace(/\s/g, '');
    const withoutSymbol = trimmed.replace(/(?:tl|try|₺)/gi, '');

    if (withoutSymbol.includes(',') && withoutSymbol.includes('.')) {
      const normalized = withoutSymbol.replace(/\./g, '').replace(',', '.');
      return this.roundCurrency(parseFloat(normalized));
    }

    if (withoutSymbol.includes(',')) {
      return this.roundCurrency(parseFloat(withoutSymbol.replace(',', '.')));
    }

    return this.roundCurrency(parseFloat(withoutSymbol));
  }

  private extractShiftId(content: string): string | undefined {
    const labeled = content.match(SHIFT_PATTERN);
    if (labeled?.[1]) return labeled[1].toLowerCase();

    const uuidMatch = content.match(UUID_PATTERN);
    return uuidMatch?.[0].toLowerCase();
  }

  private extractAmount(content: string, pattern: RegExp): number | undefined {
    const match = content.match(pattern);
    if (!match?.[1]) return undefined;

    const parsed = this.normalizeCurrency(match[1]);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  private extractNotes(content: string): string | undefined {
    const match = content.match(NOTES_PATTERN);
    if (!match?.[1]) return undefined;
    return match[1].trim();
  }

  private roundCurrency(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
