const CSV = `name,category,mrp,price,wholesale_price,wholesale_min_qty,pack_info,description,is_green
Family gift box 45 items,gift-boxes,6000,1200,1000,10,"Sparklers 2 boxes, flower pots 5, chakkars 10",Best for families,yes
Flower pot big,flower-pots,900,180,150,20,10 pieces per box,,no
`;

export function GET() {
  return new Response(CSV, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="crackers-price-list-template.csv"',
    },
  });
}
