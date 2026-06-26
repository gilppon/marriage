/**
 * 일본 사용자들이 선호하는 비즈니스/정중한 경어(Keigo) 표현 템플릿 사전
 */
export const PoliteTemplates = {
  /**
   * 정교하게 가공된 경어 템플릿 반환
   */
  getPoliteTemplate: (
    type: 'FIRST_GREETING' | 'ACCEPT_MATCH' | 'POLITE_DECLINE',
    targetName: string
  ): string => {
    switch (type) {
      case 'FIRST_GREETING':
        return `はじめまして、プロフィールを拝見し、価値観がとても合うと感じてご連絡いたしました。お忙しいところ恐縮ですが、どうぞよろしくお願いいたします。`;
      
      case 'ACCEPT_MATCH':
        return `マッチングありがとうございます！${targetName}様とお話しできるのを大変楽しみにしておりました。これからどうぞよろしくお願いいたします。`;
      
      case 'POLITE_DECLINE':
        return `せっかくのご縁をいただき大変心苦しいのですが、熟考いたしました結果、私の結婚に関する希望条件と少し異なる部分があり、これ以上お進みすることは難しいと判断いたしました。${targetName}様に素晴らしいご縁がありますよう、心よりお祈り申し上げます。`;
      
      default:
        return 'よろしくお願いいたします。';
    }
  }
};
