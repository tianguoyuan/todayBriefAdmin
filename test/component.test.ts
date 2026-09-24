import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminTopbar from '../src/components/AdminTopbar.vue'
import EmptyState from '../src/components/EmptyState.vue'
import StatCard from '../src/components/StatCard.vue'

describe('statCard.vue', () => {
  it('renders label and value', () => {
    const wrapper = mount(StatCard, { props: { label: '新闻总数', value: 42 } })
    expect(wrapper.text()).toContain('42')
    expect(wrapper.text()).toContain('新闻总数')
  })

  it('renders the hint when provided', () => {
    const wrapper = mount(StatCard, { props: { hint: '活跃 8', label: '用户总数', value: 10 } })
    expect(wrapper.text()).toContain('活跃 8')
  })
})

describe('emptyState.vue', () => {
  it('renders title and description', () => {
    const wrapper = mount(EmptyState, { props: { description: '试试调整筛选条件', title: '暂无数据' } })
    expect(wrapper.text()).toContain('暂无数据')
    expect(wrapper.text()).toContain('试试调整筛选条件')
  })

  it('renders content in the default slot', () => {
    const wrapper = mount(EmptyState, {
      props: { title: '暂无数据' },
      slots: { default: '<button>新建</button>' },
    })
    expect(wrapper.find('button').exists()).toBe(true)
  })
})

describe('adminTopbar.vue', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  function mockMatchMedia() {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation(() => ({
        addEventListener: vi.fn(),
        addListener: vi.fn(),
        dispatchEvent: vi.fn(),
        matches: false,
        media: '',
        onchange: null,
        removeEventListener: vi.fn(),
        removeListener: vi.fn(),
      })),
    )
  }

  it('toggles the account menu on avatar click and shows both entries', async () => {
    mockMatchMedia()
    const wrapper = mount(AdminTopbar)
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    await wrapper.find('button[title="账户菜单"]').trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('个人信息')
    expect(wrapper.text()).toContain('退出登录')
  })

  it('opens the profile modal from the menu', async () => {
    mockMatchMedia()
    const wrapper = mount(AdminTopbar)
    await wrapper.find('button[title="账户菜单"]').trigger('click')
    await wrapper.findAll('[role="menuitem"]')[0].trigger('click')
    expect(wrapper.find('[role="menu"]').exists()).toBe(false)
    const bodyText = document.body.textContent ?? ''
    expect(bodyText).toContain('个人信息')
    expect(bodyText).toContain('admin@todaybrief')
  })
})
