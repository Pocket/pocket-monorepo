import { ExportStateService } from './exportStateService';

describe('export state service', () => {
  it('marks complete when all services are true', () => {
    const input = {
      annotations: true,
      annotationsCompletedAt: '2025-03-06T18:55:14.368Z',
      createdAt: '2025-03-06T18:54:11.954Z',
      expiresAt: 1742756051,
      list: true,
      listCompletedAt: '2025-03-06T18:55:14.410Z',
      requestId: '89d183ad-0957-45ef-ae2e-018476f8c61c',
      shareablelists: true,
      shareablelistsCompletedAt: '2025-03-06T18:54:19.183Z',
    };
    expect(ExportStateService.isComplete(input)).toBeTrue();
  });
});
