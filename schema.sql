-- Figtree Club 데이터베이스 스키마
-- Supabase Dashboard → SQL Editor 에서 실행하세요

-- 1. 판매자 프로필
create table if not exists sellers (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  contact_name text,
  phone text,
  country text default '한국',
  categories text[] default '{}',
  avatar_url text,
  description text,
  rating numeric(2,1) default 0,
  review_count int default 0,
  response_time text default '2시간 이내',
  verified boolean default false,
  created_at timestamptz default now()
);

-- 2. 번들 (상품)
create table if not exists bundles (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references sellers(id) on delete cascade not null,
  name text not null,
  category text not null,
  brand text,
  price int not null,
  quantity int not null,
  grade text not null,
  size_range text,
  description text,
  dispatch_time text default '24시간 이내',
  weight numeric(5,1),
  photos text[] default '{}',
  videos text[] default '{}',
  status text default 'active' check (status in ('active', 'draft', 'sold_out')),
  views int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. 주문
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  order_number text unique not null,
  bundle_id uuid references bundles(id) on delete set null,
  seller_id uuid references sellers(id) on delete set null not null,
  buyer_id uuid references auth.users(id) on delete set null,
  buyer_name text,
  buyer_country text,
  quantity int default 1,
  total_price int not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'shipping', 'delivered', 'cancelled')),
  tracking_number text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. 메시지
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references auth.users(id) on delete set null not null,
  receiver_id uuid references auth.users(id) on delete set null not null,
  bundle_id uuid references bundles(id) on delete set null,
  content text not null,
  read boolean default false,
  created_at timestamptz default now()
);

-- 5. 리뷰
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  bundle_id uuid references bundles(id) on delete cascade,
  seller_id uuid references sellers(id) on delete cascade not null,
  buyer_id uuid references auth.users(id) on delete set null,
  buyer_name text,
  rating int not null check (rating >= 1 and rating <= 5),
  content text,
  created_at timestamptz default now()
);

-- 인덱스
create index if not exists idx_bundles_seller on bundles(seller_id);
create index if not exists idx_bundles_status on bundles(status);
create index if not exists idx_bundles_category on bundles(category);
create index if not exists idx_orders_seller on orders(seller_id);
create index if not exists idx_orders_buyer on orders(buyer_id);
create index if not exists idx_messages_receiver on messages(receiver_id);
create index if not exists idx_messages_sender on messages(sender_id);
create index if not exists idx_reviews_seller on reviews(seller_id);

-- RLS (Row Level Security) 활성화
alter table sellers enable row level security;
alter table bundles enable row level security;
alter table orders enable row level security;
alter table messages enable row level security;
alter table reviews enable row level security;

-- RLS 정책: 번들은 누구나 읽을 수 있음
create policy "bundles_public_read" on bundles for select using (true);
-- 판매자만 자기 번들 수정/삭제
create policy "bundles_seller_write" on bundles for insert with check (auth.uid() = seller_id);
create policy "bundles_seller_update" on bundles for update using (auth.uid() = seller_id);
create policy "bundles_seller_delete" on bundles for delete using (auth.uid() = seller_id);

-- 판매자 프로필: 누구나 읽기, 본인만 쓰기
create policy "sellers_public_read" on sellers for select using (true);
create policy "sellers_own_write" on sellers for insert with check (auth.uid() = id);
create policy "sellers_own_update" on sellers for update using (auth.uid() = id);

-- 주문: 관련자만 접근
create policy "orders_buyer_read" on orders for select using (auth.uid() = buyer_id or auth.uid() = seller_id);
create policy "orders_buyer_create" on orders for insert with check (auth.uid() = buyer_id);
create policy "orders_seller_update" on orders for update using (auth.uid() = seller_id);

-- 메시지: 송수신자만 접근
create policy "messages_participants" on messages for select using (auth.uid() = sender_id or auth.uid() = receiver_id);
create policy "messages_send" on messages for insert with check (auth.uid() = sender_id);
create policy "messages_mark_read" on messages for update using (auth.uid() = receiver_id);

-- 리뷰: 누구나 읽기, 구매자만 쓰기
create policy "reviews_public_read" on reviews for select using (true);
create policy "reviews_buyer_write" on reviews for insert with check (auth.uid() = buyer_id);

-- Storage 버킷 (Supabase Dashboard → Storage 에서 'bundle-media' 버킷을 public으로 생성하세요)
-- insert into storage.buckets (id, name, public) values ('bundle-media', 'bundle-media', true);
