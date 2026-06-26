import { db } from '../config/firebase';
import { UserWallet, MembershipType } from '../types/bmTypes';

// 가상 인메모리 지갑 (GCP 연결 불가 Fallback)
const mockWallets = new Map<string, UserWallet>();

export const BillingService = {
  /**
   * 유저의 지갑 정보를 가져옵니다. 없으면 기본 지갑(하트 5개, 일반 회원)을 즉시 신설합니다.
   */
  getWallet: async (userId: string): Promise<UserWallet> => {
    const defaultWallet: UserWallet = {
      userId,
      hearts: 5,
      membershipType: 'FREE'
    };

    try {
      if (!db) throw new Error('NO_DB');
      const docRef = db.collection('wallets').doc(userId);
      const snap = await docRef.get();
      if (snap.exists) {
        return snap.data() as UserWallet;
      } else {
        await docRef.set(defaultWallet);
        return defaultWallet;
      }
    } catch (error) {
      let wallet = mockWallets.get(userId);
      if (!wallet) {
        wallet = defaultWallet;
        mockWallets.set(userId, wallet);
      }
      return wallet;
    }
  },

  /**
   * 일반 유저의 메시지/좋아요 전송 등 일반 행동 시 페이월을 검증합니다.
   */
  checkPaywallGate: async (userId: string, action: 'SEND_MESSAGE' | 'SEND_LIKE'): Promise<boolean> => {
    const wallet = await BillingService.getWallet(userId);
    if (wallet.membershipType === 'PREMIUM') {
      return true; // 프리미엄 회원은 무제한 패스
    }
    if (wallet.hearts <= 0) {
      throw new Error('PAYWALL_TRIGGERED'); // 하트가 부족하여 페이월 게이트 작동
    }
    return true;
  },

  /**
   * 음성 통화를 구동할 수 있는지 잔여 권한을 검증합니다. (최소 1하트 필요)
   */
  checkCallPermission: async (userId: string): Promise<boolean> => {
    const wallet = await BillingService.getWallet(userId);
    if (wallet.membershipType === 'PREMIUM') return true;
    return wallet.hearts >= 1;
  },

  /**
   * 사용자의 하트를 차감합니다. (Premium 등급은 소모 면제)
   */
  consumeHeart: async (userId: string, amount: number = 1): Promise<UserWallet> => {
    const wallet = await BillingService.getWallet(userId);
    if (wallet.membershipType === 'PREMIUM') return wallet; // 프리미엄 회원은 면제

    const newHearts = Math.max(0, wallet.hearts - amount);
    const updatedWallet = { ...wallet, hearts: newHearts };

    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('wallets').doc(userId).set(updatedWallet, { merge: true });
      return updatedWallet;
    } catch (error) {
      mockWallets.set(userId, updatedWallet);
      return updatedWallet;
    }
  },

  /**
   * 결제 시뮬레이션: 하트 충전 및 멤버십 등급 업그레이드를 처리합니다.
   */
  chargeHearts: async (userId: string, amount: number, isUpgrade: boolean = false): Promise<UserWallet> => {
    const wallet = await BillingService.getWallet(userId);
    const newHearts = wallet.hearts + amount;
    const newMembership: MembershipType = isUpgrade ? 'PREMIUM' : wallet.membershipType;

    const updatedWallet = {
      userId,
      hearts: newHearts,
      membershipType: newMembership
    };

    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('wallets').doc(userId).set(updatedWallet, { merge: true });
      return updatedWallet;
    } catch (error) {
      mockWallets.set(userId, updatedWallet);
      return updatedWallet;
    }
  },

  /**
   * 테스트용 지갑 강제 재설정 메소드
   */
  setWalletForTest: async (userId: string, hearts: number, membershipType: MembershipType): Promise<UserWallet> => {
    const updatedWallet = {
      userId,
      hearts,
      membershipType
    };

    try {
      if (!db) throw new Error('NO_DB');
      await db.collection('wallets').doc(userId).set(updatedWallet, { merge: true });
      return updatedWallet;
    } catch (error) {
      mockWallets.set(userId, updatedWallet);
      return updatedWallet;
    }
  }
};
