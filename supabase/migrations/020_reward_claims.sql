-- Reward Claims Table
-- Tracks when users claim their rewards

CREATE TABLE IF NOT EXISTS reward_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE NOT NULL,
  claimed_at TIMESTAMP DEFAULT NOW() NOT NULL,
  stars_spent INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_reward_claims_user_id ON reward_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_reward_claims_reward_id ON reward_claims(reward_id);

-- RLS Policies
ALTER TABLE reward_claims ENABLE ROW LEVEL SECURITY;

-- Users can view their own claims
CREATE POLICY "Users can view own reward claims"
  ON reward_claims FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own claims
CREATE POLICY "Users can create own reward claims"
  ON reward_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE reward_claims IS
  'Tracks when users claim their rewards by spending stars';
