import QRCode from 'qrcode';

export interface TicketField {
    type: 'text' | 'qrcode';
    field: 'user_name' | 'ticket_name' | 'registration_id' | 'date' | 'custom';
    customValue?: string;
    x: number;
    y: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    align?: 'left' | 'center' | 'right';
    size?: number; // For QR code
}

export interface TicketTemplate {
    id?: string;
    ticket_id: string;
    background_url: string;
    fields: TicketField[];
}

export interface TicketData {
    user_name: string;
    ticket_name: string;
    registration_id: string;
    date: string;
}

/**
 * Generate a ticket image from template and data
 */
export async function generateTicketImage(
    template: TicketTemplate,
    data: TicketData
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        const backgroundImage = new Image();
        backgroundImage.crossOrigin = 'anonymous';

        backgroundImage.onload = async () => {
            // Set canvas size to match background
            canvas.width = backgroundImage.width;
            canvas.height = backgroundImage.height;

            // Draw background
            ctx.drawImage(backgroundImage, 0, 0);

            // Render each field
            for (const field of template.fields) {
                await renderField(ctx, field, data);
            }

            // Convert to blob
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Could not generate image blob'));
                }
            }, 'image/png');
        };

        backgroundImage.onerror = () => {
            reject(new Error('Could not load background image'));
        };

        backgroundImage.src = template.background_url;
    });
}

/**
 * Render a single field on the canvas
 */
async function renderField(
    ctx: CanvasRenderingContext2D,
    field: TicketField,
    data: TicketData
): Promise<void> {
    const value = getFieldValue(field, data);

    if (field.type === 'text') {
        const fontSize = field.fontSize || 24;
        const fontFamily = field.fontFamily || 'Arial';
        const color = field.color || '#000000';
        const align = field.align || 'left';

        ctx.font = `${fontSize}px ${fontFamily}`;
        ctx.fillStyle = color;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';

        ctx.fillText(value, field.x, field.y);
    } else if (field.type === 'qrcode') {
        const size = field.size || 100;

        try {
            const qrDataUrl = await QRCode.toDataURL(value, {
                width: size,
                margin: 1,
                color: {
                    dark: field.color || '#000000',
                    light: '#ffffff',
                },
            });

            const qrImage = new Image();
            await new Promise<void>((resolve, reject) => {
                qrImage.onload = () => {
                    ctx.drawImage(qrImage, field.x, field.y, size, size);
                    resolve();
                };
                qrImage.onerror = reject;
                qrImage.src = qrDataUrl;
            });
        } catch (error) {
            console.error('Error generating QR code:', error);
        }
    }
}

/**
 * Get the value for a field from the ticket data
 */
function getFieldValue(field: TicketField, data: TicketData): string {
    if (field.field === 'custom' && field.customValue) {
        return field.customValue;
    }
    return data[field.field] || '';
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Generate ticket image and return as data URL for preview
 */
export async function generateTicketDataUrl(
    template: TicketTemplate,
    data: TicketData
): Promise<string> {
    const blob = await generateTicketImage(template, data);
    return URL.createObjectURL(blob);
}
