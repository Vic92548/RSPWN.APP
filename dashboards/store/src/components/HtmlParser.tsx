// dashboards/store/src/components/HtmlParser.tsx
import DOMPurify from 'dompurify';
import parse, { Element, domToReact, HTMLReactParserOptions, DOMNode } from 'html-react-parser';

interface HtmlParserProps {
    html: string;
    className?: string;
}

export default function HtmlParser({ html, className = '' }: HtmlParserProps) {
    // Sanitize the HTML first
    const cleanHtml = DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p', 'br', 'strong', 'b', 'em', 'i', 'u', 'span', 'div',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
            'a', 'img', 'hr', 'table', 'thead', 'tbody', 'tr', 'td', 'th'
        ],
        ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class', 'id', 'target', 'rel', 'style'],
        ALLOW_DATA_ATTR: false
    });

    const options: HTMLReactParserOptions = {
        replace: (domNode) => {
            if (domNode instanceof Element && domNode.attribs) {
                const { name, attribs, children } = domNode;

                // Handle different HTML elements with custom styling
                switch (name) {
                    case 'p':
                        return (
                            <p className="mb-4 leading-relaxed text-muted-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </p>
                        );

                    case 'strong':
                    case 'b':
                        return (
                            <strong className="font-bold text-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </strong>
                        );

                    case 'em':
                    case 'i':
                        return (
                            <em className="italic">
                                {domToReact(children as DOMNode[], options)}
                            </em>
                        );

                    case 'u':
                        return (
                            <span className="underline">
                                {domToReact(children as DOMNode[], options)}
                            </span>
                        );

                    case 'h1':
                        return (
                            <h1 className="text-3xl font-bold mb-4 mt-6 text-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </h1>
                        );

                    case 'h2':
                        return (
                            <h2 className="text-2xl font-bold mb-3 mt-5 text-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </h2>
                        );

                    case 'h3':
                        return (
                            <h3 className="text-xl font-semibold mb-2 mt-4 text-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </h3>
                        );

                    case 'h4':
                        return (
                            <h4 className="text-lg font-semibold mb-2 mt-3 text-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </h4>
                        );

                    case 'ul':
                        return (
                            <ul className="list-disc list-inside mb-4 space-y-1 ml-4 text-muted-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </ul>
                        );

                    case 'ol':
                        return (
                            <ol className="list-decimal list-inside mb-4 space-y-1 ml-4 text-muted-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </ol>
                        );

                    case 'li':
                        return (
                            <li className="ml-2">
                                {domToReact(children as DOMNode[], options)}
                            </li>
                        );

                    case 'blockquote':
                        return (
                            <blockquote className="border-l-4 border-primary/30 pl-4 py-2 mb-4 italic text-muted-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </blockquote>
                        );

                    case 'pre':
                        return (
                            <pre className="bg-muted/50 p-4 rounded-md mb-4 overflow-x-auto">
                                {domToReact(children as DOMNode[], options)}
                            </pre>
                        );

                    case 'code':
                        // Check if it's inside a pre tag
                        const isInlinedCode = domNode.parent && domNode.parent.type === 'tag' && domNode.parent.name !== 'pre';
                        if (isInlinedCode) {
                            return (
                                <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                                    {domToReact(children as DOMNode[], options)}
                                </code>
                            );
                        }
                        return (
                            <code className="font-mono text-sm">
                                {domToReact(children as DOMNode[], options)}
                            </code>
                        );

                    case 'a':
                        return (
                            <a
                                href={attribs.href}
                                target={attribs.target || '_blank'}
                                rel={attribs.rel || 'noopener noreferrer'}
                                className="text-primary hover:underline font-medium"
                            >
                                {domToReact(children as DOMNode[], options)}
                            </a>
                        );

                    case 'img':
                        return (
                            <img
                                src={attribs.src}
                                alt={attribs.alt || ''}
                                title={attribs.title}
                                className="max-w-full h-auto rounded-md my-4"
                            />
                        );

                    case 'hr':
                        return <hr className="my-6 border-border" />;

                    case 'br':
                        return <br />;

                    case 'table':
                        return (
                            <div className="overflow-x-auto mb-4">
                                <table className="min-w-full border border-border">
                                    {domToReact(children as DOMNode[], options)}
                                </table>
                            </div>
                        );

                    case 'thead':
                        return (
                            <thead className="bg-muted/50">
                            {domToReact(children as DOMNode[], options)}
                            </thead>
                        );

                    case 'tbody':
                        return (
                            <tbody className="divide-y divide-border">
                            {domToReact(children as DOMNode[], options)}
                            </tbody>
                        );

                    case 'tr':
                        return (
                            <tr className="hover:bg-muted/30 transition-colors">
                                {domToReact(children as DOMNode[], options)}
                            </tr>
                        );

                    case 'th':
                        return (
                            <th className="px-4 py-2 text-left font-semibold text-foreground border-b border-border">
                                {domToReact(children as DOMNode[], options)}
                            </th>
                        );

                    case 'td':
                        return (
                            <td className="px-4 py-2 text-muted-foreground">
                                {domToReact(children as DOMNode[], options)}
                            </td>
                        );

                    case 'div':
                        // Handle divs with specific classes from Tebex
                        if (attribs.class) {
                            const classes = attribs.class.split(' ');

                            // Handle alert/notice boxes
                            if (classes.includes('alert') || classes.includes('notice')) {
                                return (
                                    <div className="bg-primary/10 border border-primary/20 rounded-md p-4 mb-4">
                                        {domToReact(children as DOMNode[], options)}
                                    </div>
                                );
                            }

                            // Handle warning boxes
                            if (classes.includes('warning') || classes.includes('danger')) {
                                return (
                                    <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 mb-4">
                                        {domToReact(children as DOMNode[], options)}
                                    </div>
                                );
                            }

                            // Handle info boxes
                            if (classes.includes('info')) {
                                return (
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-4 mb-4">
                                        {domToReact(children as DOMNode[], options)}
                                    </div>
                                );
                            }
                        }

                        return (
                            <div className="mb-4">
                                {domToReact(children as DOMNode[], options)}
                            </div>
                        );

                    case 'span':
                        // Handle styled spans
                        if (attribs.style) {
                            const style: any = {};

                            // Parse inline styles safely
                            const styleRules = attribs.style.split(';').filter(Boolean);
                            styleRules.forEach((rule) => {
                                const [property, value] = rule.split(':').map(s => s.trim());
                                if (property && value) {
                                    // Convert CSS properties to React style properties
                                    const reactProperty = property.replace(/-([a-z])/g, (g) => g[1].toUpperCase());

                                    // Only allow safe style properties
                                    if (['color', 'backgroundColor', 'fontWeight', 'fontSize', 'textDecoration'].includes(reactProperty)) {
                                        style[reactProperty] = value;
                                    }
                                }
                            });

                            return (
                                <span style={style}>
                                    {domToReact(children as DOMNode[], options)}
                                </span>
                            );
                        }

                        return <span>{domToReact(children as DOMNode[], options)}</span>;

                    default:
                        return undefined;
                }
            }
        }
    };

    return (
        <div className={`prose prose-invert max-w-none ${className}`}>
            {parse(cleanHtml, options)}
        </div>
    );
}