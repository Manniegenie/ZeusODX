# Receipt UI Guide

This guide ensures all receipt screens maintain visual consistency and proper dark/light mode support. **All hardcoded colors are forbidden** — use the theme colors from `useTheme()` hook instead.

## Standard Receipt Structure

Every receipt component follows this pattern:

```tsx
import { useTheme } from '../../hooks/useTheme';
import type { AppColors } from '../../hooks/useTheme';

export default function ReceiptScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  // ... rest of component
}

const makeStyles = (colors: AppColors) => StyleSheet.create({
  // All styles reference colors.* — never hardcode colors
});
```

## Color Palette Reference

Use ONLY these theme colors. Do not hardcode hex values like `#F8F9FA`, `#6B7280`, etc.

| Element | Color Property | Usage |
|---------|-----------------|-------|
| **Container background** | `colors.background` | Main screen/container background |
| **Card background** | `colors.card` | Details card, button backgrounds |
| **Text (primary)** | `colors.text` | Headers, amounts, main text |
| **Text (secondary/labels)** | `#FFFFFF` | Row labels, subtexts in receipts |
| **Borders** | `colors.border` | Card borders, dividers |
| **Input background** | `colors.inputBg` | Copy button, input fields |
| **Primary action** | `colors.primary` | Primary buttons, links |
| **Status (Success)** | hardcoded `#E8F7EF` + `#166534` + `#BBE7CC` | Status pills only — these are intentional branding colors |
| **Status (Error)** | hardcoded `#FDECEC` + `#991B1B` + `#F6CACA` | Status pills only — these are intentional branding colors |
| **Status (Pending)** | hardcoded `#FFF8E6` + `#92400E` + `#FBE1B3` | Status pills only — these are intentional branding colors |

## Common Mistakes (DO NOT DO)

❌ **Hardcoded light-mode colors:**
```tsx
// WRONG
backgroundColor: '#F8F9FA'     // Light gray (shows as whitish in dark mode)
backgroundColor: '#F3F0FF'     // Light purple
color: '#6B7280'               // Medium gray
borderColor: '#E5E7EB'         // Light border
```

✅ **Correct theme-based colors:**
```tsx
// RIGHT
backgroundColor: colors.card
backgroundColor: colors.background
color: colors.textSecondary
borderColor: colors.border
```

## Receipt Layout Template

```tsx
const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.background,  // ← Match container
  },

  detailsCard: {
    backgroundColor: colors.card,        // ← NOT hardcoded #F8F9FA
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderWidth: 1,
    borderColor: colors.border,          // ← NOT hardcoded #E5E7EB
  },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 8 },
  rowLabel: {
    color: '#FFFFFF',                    // ← White for subtexts
    fontSize: 14,
  },
  rowValue: {
    color: colors.text,                  // ← Main text
    fontSize: 14,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16 },  // ← White is fine

  secondaryButton: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryButtonText: { color: colors.text, fontSize: 16 },
});
```

## Passing Styles to Subcomponents

Always pass `styles` as a prop to child components that need styling:

```tsx
// Parent component
<Row styles={styles} label="Amount" value="₦5,000" />

// Row component
function Row({ styles, label, value }: { styles: any; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}
```

## Real-World Examples

**✅ Good:** `app/history/TransactionReceipt.tsx` — All colors use theme variables

**✅ Good:** `components/UtilityReceipt.tsx` — Consistent with theme

**❌ Fixed:** `app/receipt/internal-transfer.tsx` — Had hardcoded colors, now uses theme

## Testing Dark/Light Mode

Before committing a receipt component:

1. Toggle dark/light mode in device settings
2. Verify backgrounds are not white/gray boxes in dark mode
3. Verify text is readable on both modes
4. Check card backgrounds adapt to theme

If you see "whitish stuff" in dark mode, you likely hardcoded a light color. Use `colors.*` instead.
